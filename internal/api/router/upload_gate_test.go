package router_test

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/Mmx233/HeyFileGo/v2/internal/share"
)

func TestUploadQueuesGloballyBeforeReadingAndCancelsWaitingRequest(t *testing.T) {
	t.Chdir(t.TempDir())
	target, err := share.OpenTarget("")
	if err != nil {
		t.Fatal(err)
	}
	defer target.Close()
	if err := target.SetUploadConcurrency(1); err != nil {
		t.Fatal(err)
	}
	engine := newEngine(target)
	first := uploadRequest(t, "first.txt", "first contents")
	started, resume := make(chan struct{}), make(chan struct{})
	var resumeOnce sync.Once
	defer resumeOnce.Do(func() { close(resume) })
	first.Body = &blockedUploadBody{ReadCloser: first.Body, started: started, resume: resume}
	firstDone := make(chan *httptest.ResponseRecorder, 1)
	go func() {
		response := httptest.NewRecorder()
		engine.ServeHTTP(response, first)
		firstDone <- response
	}()
	select {
	case <-started:
	case <-time.After(2 * time.Second):
		t.Fatal("first upload never began reading")
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	second := uploadRequest(t, "second.txt", "canceled contents").WithContext(ctx)
	observed := &observedUploadBody{ReadCloser: second.Body}
	second.Body = observed
	secondDone := make(chan *httptest.ResponseRecorder, 1)
	go func() {
		response := httptest.NewRecorder()
		engine.ServeHTTP(response, second)
		secondDone <- response
	}()
	select {
	case response := <-secondDone:
		t.Fatalf("second upload bypassed the shared capacity: %d", response.Code)
	case <-time.After(30 * time.Millisecond):
	}
	cancel()
	select {
	case response := <-secondDone:
		if response.Code != http.StatusRequestTimeout || observed.reads.Load() != 0 {
			t.Fatalf("queued cancellation response = %d, body reads = %d", response.Code, observed.reads.Load())
		}
	case <-time.After(2 * time.Second):
		t.Fatal("queued upload did not cancel")
	}
	if _, err := os.Stat("second.txt"); !os.IsNotExist(err) {
		t.Fatalf("queued canceled upload created a file: %v", err)
	}
	resumeOnce.Do(func() { close(resume) })
	select {
	case response := <-firstDone:
		if response.Code != http.StatusOK {
			t.Fatalf("first upload = %d %s", response.Code, response.Body.String())
		}
	case <-time.After(2 * time.Second):
		t.Fatal("first upload did not complete")
	}
	third := httptest.NewRecorder()
	engine.ServeHTTP(third, uploadRequest(t, "third.txt", "third contents"))
	if third.Code != http.StatusOK {
		t.Fatalf("capacity was not released: %d %s", third.Code, third.Body.String())
	}
}

type blockedUploadBody struct {
	io.ReadCloser
	started chan struct{}
	resume  chan struct{}
	once    sync.Once
}

func (r *blockedUploadBody) Read(buffer []byte) (int, error) {
	r.once.Do(func() { close(r.started) })
	<-r.resume
	return r.ReadCloser.Read(buffer)
}

type observedUploadBody struct {
	io.ReadCloser
	reads atomic.Int32
}

func (r *observedUploadBody) Read(buffer []byte) (int, error) {
	r.reads.Add(1)
	return r.ReadCloser.Read(buffer)
}
