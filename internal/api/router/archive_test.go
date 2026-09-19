package router_test

import (
	"archive/zip"
	"bytes"
	"errors"
	"io"
	"math/rand/v2"
	"mime"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	appRouter "github.com/Mmx233/HeyFileGo/v2/internal/router"
	"github.com/Mmx233/HeyFileGo/v2/internal/share"
)

func archiveRequest(values url.Values) *http.Request {
	request := httptest.NewRequest(http.MethodPost, "/api/dir/archive", strings.NewReader(values.Encode()))
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	return request
}

func TestArchiveStreamFailureAbortsHTTPResponse(t *testing.T) {
	rootPath := t.TempDir()
	content := make([]byte, 256<<10)
	random := rand.New(rand.NewPCG(1, 2))
	for i := range content {
		content[i] = byte(random.Uint32())
	}
	if err := os.WriteFile(filepath.Join(rootPath, "file.bin"), content, 0o600); err != nil {
		t.Fatal(err)
	}
	target, err := share.OpenTarget(rootPath)
	if err != nil {
		t.Fatal(err)
	}
	defer target.Close()
	engine := appRouter.Init(target)
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		engine.ServeHTTP(&failingHTTPWriter{ResponseWriter: w, remaining: 32 << 10}, r)
	}))
	defer server.Close()
	client := server.Client()
	client.Timeout = 5 * time.Second
	response, err := client.PostForm(server.URL+"/api/dir/archive", url.Values{"path": {"file.bin"}})
	if err != nil {
		t.Fatalf("expected headers and an incomplete response body, got %v", err)
	}
	defer response.Body.Close()
	content, err = io.ReadAll(response.Body)
	if response.StatusCode != http.StatusOK || err == nil {
		t.Fatalf("archive failure finalized the HTTP response: status %d, read error %v", response.StatusCode, err)
	}
	if _, err := zip.NewReader(bytes.NewReader(content), int64(len(content))); err == nil {
		t.Fatal("archive stream failure produced a valid partial ZIP")
	}
}

func TestArchiveChangeBeforeFirstByteReturnsJSONError(t *testing.T) {
	rootPath := t.TempDir()
	filePath := filepath.Join(rootPath, "file.txt")
	if err := os.WriteFile(filePath, []byte("original"), 0o600); err != nil {
		t.Fatal(err)
	}
	target, err := share.OpenTarget(rootPath)
	if err != nil {
		t.Fatal(err)
	}
	defer target.Close()
	response := httptest.NewRecorder()
	writer := &changingArchiveWriter{ResponseWriter: response, path: filePath}
	newEngine(target).ServeHTTP(writer, archiveRequest(url.Values{"path": {"file.txt"}}))
	if writer.err != nil {
		t.Fatal(writer.err)
	}
	if !writer.changed || response.Code != http.StatusInternalServerError ||
		!strings.HasPrefix(response.Header().Get("Content-Type"), "application/json") ||
		response.Header().Get("Content-Disposition") != "" {
		t.Fatalf("pre-stream change must return readable JSON: changed=%v status=%d headers=%v body=%s", writer.changed, response.Code, response.Header(), response.Body.String())
	}
}

type changingArchiveWriter struct {
	http.ResponseWriter
	path    string
	changed bool
	err     error
}

func (w *changingArchiveWriter) Header() http.Header {
	header := w.ResponseWriter.Header()
	if !w.changed && header.Get("Content-Type") == "application/zip" {
		w.changed = true
		w.err = os.WriteFile(w.path, []byte("changed after preflight"), 0o600)
	}
	return header
}

type failingHTTPWriter struct {
	http.ResponseWriter
	remaining int
}

func (w *failingHTTPWriter) Write(content []byte) (int, error) {
	if len(content) > w.remaining {
		return 0, errors.New("injected archive stream failure")
	}
	w.remaining -= len(content)
	return w.ResponseWriter.Write(content)
}

func TestArchiveAPIAndValidation(t *testing.T) {
	rootPath := t.TempDir()
	if err := os.MkdirAll(filepath.Join(rootPath, "folder", "empty"), 0o700); err != nil {
		t.Fatal(err)
	}
	name := "file+%& #文件.txt"
	if err := os.WriteFile(filepath.Join(rootPath, "folder", name), []byte("payload"), 0o600); err != nil {
		t.Fatal(err)
	}
	target, err := share.OpenTarget(rootPath)
	if err != nil {
		t.Fatal(err)
	}
	defer target.Close()
	engine := newEngine(target)
	response := httptest.NewRecorder()
	engine.ServeHTTP(response, archiveRequest(url.Values{"path": {"folder", "folder/" + name}}))
	if response.Code != http.StatusOK || response.Header().Get("Content-Type") != "application/zip" {
		t.Fatalf("archive response = %d %s", response.Code, response.Body.String())
	}
	_, params, err := mime.ParseMediaType(response.Header().Get("Content-Disposition"))
	if err != nil || params["filename"] != "folder.zip" {
		t.Fatalf("archive disposition = %q, %v", response.Header().Get("Content-Disposition"), err)
	}
	reader, err := zip.NewReader(bytes.NewReader(response.Body.Bytes()), int64(response.Body.Len()))
	if err != nil || len(reader.File) != 3 {
		t.Fatalf("ZIP archive = %#v, %v", reader, err)
	}
	for _, entry := range reader.File {
		if entry.Name != "folder/"+name {
			continue
		}
		file, err := entry.Open()
		if err != nil {
			t.Fatal(err)
		}
		content, err := io.ReadAll(file)
		file.Close()
		if err != nil || string(content) != "payload" {
			t.Fatalf("archive file = %q, %v", content, err)
		}
	}
	t.Run("more than ten thousand selections", func(t *testing.T) {
		paths := make([]string, 10001)
		for i := range paths {
			paths[i] = "folder/" + name
		}
		response := httptest.NewRecorder()
		engine.ServeHTTP(response, archiveRequest(url.Values{"path": paths}))
		if response.Code != http.StatusOK {
			t.Fatalf("many selections = %d %s", response.Code, response.Body.String())
		}
		reader, err := zip.NewReader(bytes.NewReader(response.Body.Bytes()), int64(response.Body.Len()))
		if err != nil || len(reader.File) != 1 || reader.File[0].Name != "folder/"+name {
			t.Fatalf("selections were not deduplicated into one valid ZIP entry: %#v, %v", reader, err)
		}
		file, err := reader.File[0].Open()
		if err != nil {
			t.Fatal(err)
		}
		defer file.Close()
		content, err := io.ReadAll(file)
		if err != nil || string(content) != "payload" {
			t.Fatalf("deduplicated file content = %q, %v", content, err)
		}
	})
	for _, values := range []url.Values{
		{}, {"path": {"../outside"}}, {"path": {"/absolute"}}, {"path": {"nested//file"}},
		{"path": {"folder"}, "extra": {"unsupported"}},
	} {
		response := httptest.NewRecorder()
		engine.ServeHTTP(response, archiveRequest(values))
		if response.Code != http.StatusBadRequest {
			t.Errorf("invalid archive form = %d %s", response.Code, response.Body.String())
		}
	}
	for _, body := range []string{"path=%zz", "p%zz=folder", "path=folder;extra=bad", "&&"} {
		request := httptest.NewRequest(http.MethodPost, "/api/dir/archive", strings.NewReader(body))
		request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		response := httptest.NewRecorder()
		engine.ServeHTTP(response, request)
		if response.Code != http.StatusBadRequest {
			t.Errorf("malformed form %q = %d %s", body, response.Code, response.Body.String())
		}
	}
	response = httptest.NewRecorder()
	engine.ServeHTTP(response, archiveRequest(url.Values{"path": {"missing"}}))
	if response.Code != http.StatusInternalServerError || response.Header().Get("Content-Disposition") != "" || strings.Contains(response.Body.String(), rootPath) {
		t.Fatalf("preflight error must precede attachment headers and hide host paths: %d %s", response.Code, response.Body.String())
	}
	response = httptest.NewRecorder()
	engine.ServeHTTP(response, archiveRequest(url.Values{"path": {strings.Repeat("x", 1<<20)}}))
	if response.Code != http.StatusBadRequest {
		t.Fatalf("oversized form = %d", response.Code)
	}
}
