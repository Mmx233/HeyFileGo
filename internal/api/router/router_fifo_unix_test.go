//go:build unix

package router_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"syscall"
	"testing"
	"time"

	"github.com/Mmx233/HeyFileGo/v2/internal/share"
)

func TestDirectoryListingSkipsFIFOWithoutBlocking(t *testing.T) {
	rootPath := t.TempDir()
	if err := syscall.Mkfifo(filepath.Join(rootPath, "pipe"), 0o600); err != nil {
		t.Skipf("cannot create FIFO: %v", err)
	}
	target, err := share.OpenTarget(rootPath)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { target.Close() })
	engine := newEngine(target)

	done := make(chan *responseResult, 1)
	go func() {
		response := performRequest(engine, "/api/dir/?path=")
		done <- &responseResult{status: response.Code, body: response.Body.String()}
	}()
	select {
	case result := <-done:
		if result.status != http.StatusOK {
			t.Fatalf("FIFO listing response = %d %q", result.status, result.body)
		}
		var listing listResponse
		if err := json.Unmarshal([]byte(result.body), &listing); err != nil {
			t.Fatal(err)
		}
		if len(listing.Data) != 0 {
			t.Fatalf("FIFO was included in listing: %#v", listing.Data)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("directory listing blocked on FIFO")
	}
}

func TestUploadPreservesDirectoryModeAndRejectsFIFO(t *testing.T) {
	rootPath := t.TempDir()
	t.Chdir(rootPath)
	if err := os.Chmod(rootPath, 0o770|os.ModeSticky|os.ModeSetgid); err != nil {
		t.Fatal(err)
	}
	before, err := os.Stat(rootPath)
	if err != nil {
		t.Fatal(err)
	}
	target, err := share.OpenTarget("")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { target.Close() })
	engine := newEngine(target)
	response := httptest.NewRecorder()
	engine.ServeHTTP(response, uploadRequest(t, "file.txt", "content"))
	if response.Code != http.StatusOK {
		t.Fatalf("upload response = %d %s", response.Code, response.Body.String())
	}
	after, err := os.Stat(rootPath)
	if err != nil || after.Mode() != before.Mode() {
		t.Fatalf("upload changed directory mode: %v, %v", after, err)
	}
	if err := syscall.Mkfifo("pipe", 0o600); err != nil {
		t.Fatal(err)
	}
	request := uploadRequest(t, "pipe", "content")
	done := make(chan *httptest.ResponseRecorder, 1)
	go func() {
		response := httptest.NewRecorder()
		engine.ServeHTTP(response, request)
		done <- response
	}()
	select {
	case response := <-done:
		if response.Code != http.StatusConflict {
			t.Fatalf("FIFO upload response = %d %s", response.Code, response.Body.String())
		}
		if info, err := os.Lstat("pipe"); err != nil || info.Mode()&os.ModeNamedPipe == 0 {
			t.Fatalf("FIFO was changed: %v", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("upload blocked on FIFO")
	}
}

type responseResult struct {
	status int
	body   string
}
