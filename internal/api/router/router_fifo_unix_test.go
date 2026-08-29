//go:build unix

package router_test

import (
	"encoding/json"
	"net/http"
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

type responseResult struct {
	status int
	body   string
}
