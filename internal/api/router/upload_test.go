package router_test

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/Mmx233/HeyFileGo/v2/internal/api/callback"
	"github.com/Mmx233/HeyFileGo/v2/internal/share"
)

func uploadRequest(t *testing.T, name, content string) *http.Request {
	t.Helper()
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	part, err := writer.CreateFormFile("file", name)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := part.Write([]byte(content)); err != nil {
		t.Fatal(err)
	}
	if err := writer.Close(); err != nil {
		t.Fatal(err)
	}
	request := httptest.NewRequest(http.MethodPost, "/api/upload", &body)
	request.Header.Set("Content-Type", writer.FormDataContentType())
	return request
}

func TestUploadAPIRejectsExistingEntries(t *testing.T) {
	rootPath := t.TempDir()
	t.Chdir(rootPath)
	target, err := share.OpenTarget("")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { target.Close() })
	engine := newEngine(target)
	if err := os.WriteFile("existing.txt", []byte("original"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir("directory", 0o700); err != nil {
		t.Fatal(err)
	}
	outsidePath := filepath.Join(t.TempDir(), "outside.txt")
	if err := os.WriteFile(outsidePath, []byte("outside"), 0o600); err != nil {
		t.Fatal(err)
	}
	names := []string{"existing.txt", "directory", "inside-link", "outside-link", "dangling-link"}
	if runtime.GOOS == "windows" {
		names = append(names, "EXISTING.TXT", "existing.txt.", "existing.txt ")
	}
	for _, name := range names {
		t.Run(name, func(t *testing.T) {
			var linkTarget string
			switch name {
			case "inside-link":
				linkTarget = "existing.txt"
			case "outside-link":
				linkTarget = outsidePath
			case "dangling-link":
				linkTarget = "missing.txt"
			}
			if linkTarget != "" {
				if err := os.Symlink(linkTarget, name); err != nil {
					t.Skipf("symlinks are unavailable: %v", err)
				}
			}
			response := httptest.NewRecorder()
			engine.ServeHTTP(response, uploadRequest(t, name, "replacement"))
			var message callback.Msg
			if err := json.Unmarshal(response.Body.Bytes(), &message); err != nil {
				t.Fatal(err)
			}
			if response.Code != http.StatusConflict || message.Code != callback.ErrFileExists.Code || message.Msg != callback.ErrFileExists.Msg {
				t.Fatalf("conflict response = %d %s", response.Code, response.Body.String())
			}
			if _, err := os.Lstat(name); err != nil {
				t.Fatalf("conflicting entry was removed: %v", err)
			}
			if linkTarget != "" {
				if got, err := os.Readlink(name); err != nil || got != linkTarget {
					t.Fatalf("symlink was changed: %q, %v", got, err)
				}
			}
		})
	}
	for name, want := range map[string]string{"existing.txt": "original", outsidePath: "outside"} {
		content, err := os.ReadFile(name)
		if err != nil || string(content) != want {
			t.Errorf("existing content %q = %q, %v", name, content, err)
		}
	}
	if _, err := os.Lstat("missing.txt"); !errors.Is(err, fs.ErrNotExist) {
		t.Fatalf("dangling symlink target was created: %v", err)
	}
	if info, err := os.Stat("directory"); err != nil || !info.IsDir() {
		t.Fatalf("existing directory was changed: %v", err)
	}
}

func TestConcurrentUploadsKeepOneCompleteFile(t *testing.T) {
	t.Chdir(t.TempDir())
	target, err := share.OpenTarget("")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { target.Close() })
	engine := newEngine(target)
	const requests = 16
	type result struct {
		response *httptest.ResponseRecorder
		content  string
	}
	results := make(chan result, requests)
	start := make(chan struct{})
	for i := range requests {
		content := strings.Repeat(fmt.Sprintf("upload-%02d;", i), 8192)
		request := uploadRequest(t, "shared.bin", content)
		go func() {
			<-start
			response := httptest.NewRecorder()
			engine.ServeHTTP(response, request)
			results <- result{response: response, content: content}
		}()
	}
	close(start)
	var successes int
	var winner string
	for range requests {
		result := <-results
		switch result.response.Code {
		case http.StatusOK:
			successes++
			winner = result.content
		case http.StatusConflict:
		default:
			t.Errorf("upload returned %d: %s", result.response.Code, result.response.Body.String())
		}
	}
	if successes != 1 {
		t.Fatalf("successful uploads = %d, want 1", successes)
	}
	content, err := os.ReadFile("shared.bin")
	if err != nil || string(content) != winner {
		t.Fatalf("saved content does not match the successful upload: length %d, %v", len(content), err)
	}
}
