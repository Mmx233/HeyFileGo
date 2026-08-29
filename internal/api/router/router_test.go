package router_test

import (
	"encoding/json"
	"fmt"
	"mime"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/Mmx233/HeyFileGo/v2/internal/api/controllers"
	api "github.com/Mmx233/HeyFileGo/v2/internal/api/router"
	"github.com/Mmx233/HeyFileGo/v2/internal/share"
	"github.com/gin-gonic/gin"
)

type listResponse struct {
	Code uint8              `json:"code"`
	Data []controllers.File `json:"data"`
}

func newEngine(target *share.Target) *gin.Engine {
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	api.Init(engine.Group("/api"), target)
	return engine
}

func performRequest(engine http.Handler, target string) *httptest.ResponseRecorder {
	request := httptest.NewRequest(http.MethodGet, target, nil)
	response := httptest.NewRecorder()
	engine.ServeHTTP(response, request)
	return response
}

func TestDirectoryAPIUsesStandardRelativePath(t *testing.T) {
	rootPath := t.TempDir()
	if err := os.Mkdir(filepath.Join(rootPath, "nested"), 0o700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(rootPath, "nested", "file.txt"), []byte("content"), 0o600); err != nil {
		t.Fatal(err)
	}

	target, err := share.OpenTarget(rootPath)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { target.Close() })
	engine := newEngine(target)

	response := performRequest(engine, "/api/dir/?path=nested")
	if response.Code != http.StatusOK {
		t.Fatalf("directory status = %d, body = %s", response.Code, response.Body.String())
	}
	var listing listResponse
	if err := json.Unmarshal(response.Body.Bytes(), &listing); err != nil {
		t.Fatal(err)
	}
	if len(listing.Data) != 1 || listing.Data[0].Name != "file.txt" || listing.Data[0].IsDir {
		t.Fatalf("directory listing = %#v", listing.Data)
	}

	response = performRequest(engine, "/api/dir/file?path=nested%2Ffile.txt")
	if response.Code != http.StatusOK || response.Body.String() != "content" {
		t.Fatalf("download = %d %q", response.Code, response.Body.String())
	}
	disposition, params, err := mime.ParseMediaType(response.Header().Get("Content-Disposition"))
	if err != nil || disposition != "attachment" || params["filename"] != "file.txt" {
		t.Fatalf("Content-Disposition = %q (%q, %#v, %v)", response.Header().Get("Content-Disposition"), disposition, params, err)
	}

	headRequest := httptest.NewRequest(http.MethodHead, "/api/dir/file?path=nested%2Ffile.txt", nil)
	headResponse := httptest.NewRecorder()
	engine.ServeHTTP(headResponse, headRequest)
	if headResponse.Code != http.StatusOK || headResponse.Body.Len() != 0 || headResponse.Header().Get("Content-Length") != "7" {
		t.Fatalf("HEAD response = %d, length %q, body %q", headResponse.Code, headResponse.Header().Get("Content-Length"), headResponse.Body.String())
	}

	response = performRequest(engine, "/api/dir/file?path=nested")
	if response.Code != http.StatusForbidden {
		t.Fatalf("directory download status = %d, body = %s", response.Code, response.Body.String())
	}

	response = performRequest(engine, "/api/dir/?path=nested%2Ffile.txt")
	if response.Code != http.StatusForbidden {
		t.Fatalf("file listing status = %d, body = %s", response.Code, response.Body.String())
	}

	response = performRequest(engine, "/api/dir/file?path=..%2Foutside.txt")
	if response.Code != http.StatusBadRequest {
		t.Fatalf("traversal status = %d, body = %s", response.Code, response.Body.String())
	}

	response = performRequest(engine, "/api/dir/file?nested%2Ffile.txt")
	if response.Code != http.StatusBadRequest {
		t.Fatalf("legacy query status = %d, body = %s", response.Code, response.Body.String())
	}

	request := httptest.NewRequest(http.MethodGet, "/api/dir/file", nil)
	request.URL.RawQuery = "path=%zz"
	response = httptest.NewRecorder()
	engine.ServeHTTP(response, request)
	if response.Code != http.StatusBadRequest {
		t.Fatalf("malformed query status = %d, body = %s", response.Code, response.Body.String())
	}
}

func TestDirectoryAPIPreservesSpecialFileNames(t *testing.T) {
	rootPath := t.TempDir()
	names := []string{
		"literal+plus.txt",
		"literal%41.txt",
		"hash#name.txt",
		"amp&equals=.txt",
		"space name.txt",
		"unicode-\u6587\u4ef6.txt",
	}
	for _, name := range names {
		if err := os.WriteFile(filepath.Join(rootPath, name), []byte(name), 0o600); err != nil {
			t.Fatal(err)
		}
	}

	target, err := share.OpenTarget(rootPath)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { target.Close() })
	engine := newEngine(target)

	for _, name := range names {
		query := url.Values{"path": {name}}.Encode()
		response := performRequest(engine, "/api/dir/file?"+query)
		if response.Code != http.StatusOK || response.Body.String() != name {
			t.Errorf("download %q = %d %q", name, response.Code, response.Body.String())
		}
		_, params, err := mime.ParseMediaType(response.Header().Get("Content-Disposition"))
		if err != nil || params["filename"] != name {
			t.Errorf("download %q Content-Disposition = %q (%#v, %v)", name, response.Header().Get("Content-Disposition"), params, err)
		}
	}
}

func TestDirectoryAPISymlinkPolicy(t *testing.T) {
	base := t.TempDir()
	rootPath := filepath.Join(base, "root")
	if err := os.Mkdir(rootPath, 0o700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(rootPath, "inside.txt"), []byte("inside"), 0o600); err != nil {
		t.Fatal(err)
	}
	outsidePath := filepath.Join(base, "outside.txt")
	if err := os.WriteFile(outsidePath, []byte("outside-secret"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink("inside.txt", filepath.Join(rootPath, "inside-link")); err != nil {
		t.Skipf("symlinks are unavailable: %v", err)
	}
	if err := os.Symlink(outsidePath, filepath.Join(rootPath, "outside-link")); err != nil {
		t.Skipf("cannot create outside symlink: %v", err)
	}

	target, err := share.OpenTarget(rootPath)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { target.Close() })
	engine := newEngine(target)

	response := performRequest(engine, "/api/dir/file?path=inside-link")
	if response.Code != http.StatusOK || response.Body.String() != "inside" {
		t.Fatalf("inside symlink response = %d %q", response.Code, response.Body.String())
	}

	response = performRequest(engine, "/api/dir/file?path=outside-link")
	if response.Code != http.StatusNotFound {
		t.Fatalf("outside symlink status = %d, body = %s", response.Code, response.Body.String())
	}
	if strings.Contains(response.Body.String(), base) || strings.Contains(response.Body.String(), "outside-secret") {
		t.Fatalf("outside path leaked in response: %s", response.Body.String())
	}

	response = performRequest(engine, "/api/dir/?path=")
	if response.Code != http.StatusOK {
		t.Fatalf("root listing status = %d, body = %s", response.Code, response.Body.String())
	}
	var listing listResponse
	if err := json.Unmarshal(response.Body.Bytes(), &listing); err != nil {
		t.Fatal(err)
	}
	foundInsideLink := false
	for _, entry := range listing.Data {
		if entry.Name == "outside-link" {
			t.Fatal("escaping symlink was exposed as a downloadable entry")
		}
		if entry.Name == "inside-link" {
			foundInsideLink = true
		}
	}
	if !foundInsideLink {
		t.Fatal("root-contained symlink was omitted from listing")
	}
}

func TestConcurrentSingleFileRangeDownloads(t *testing.T) {
	path := filepath.Join(t.TempDir(), "shared.bin")
	content := []byte(strings.Repeat("0123456789abcdef", 8192))
	if err := os.WriteFile(path, content, 0o600); err != nil {
		t.Fatal(err)
	}

	target, err := share.OpenTarget(path)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { target.Close() })
	engine := newEngine(target)

	headRequest := httptest.NewRequest(http.MethodHead, "/api/file/", nil)
	headResponse := httptest.NewRecorder()
	engine.ServeHTTP(headResponse, headRequest)
	if headResponse.Code != http.StatusOK || headResponse.Body.Len() != 0 || headResponse.Header().Get("Content-Length") != fmt.Sprint(len(content)) {
		t.Fatalf("single-file HEAD response = %d, length %q, body length %d", headResponse.Code, headResponse.Header().Get("Content-Length"), headResponse.Body.Len())
	}

	const requests = 32
	errs := make(chan error, requests)
	for i := range requests {
		go func() {
			start := i * 997
			end := start + 4095
			request := httptest.NewRequest(http.MethodGet, "/api/file/", nil)
			request.Header.Set("Range", fmt.Sprintf("bytes=%d-%d", start, end))
			response := httptest.NewRecorder()
			engine.ServeHTTP(response, request)
			if response.Code != http.StatusPartialContent {
				errs <- fmt.Errorf("range %d-%d status = %d", start, end, response.Code)
				return
			}
			if got, want := response.Body.Bytes(), content[start:end+1]; string(got) != string(want) {
				errs <- fmt.Errorf("range %d-%d returned incorrect content", start, end)
				return
			}
			errs <- nil
		}()
	}
	for range requests {
		if err := <-errs; err != nil {
			t.Fatal(err)
		}
	}
}
