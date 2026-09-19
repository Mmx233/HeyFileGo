//go:build unix

package share

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"syscall"
	"testing"
	"time"
)

func TestArchiveRejectsUnsafePortableNames(t *testing.T) {
	rootPath := t.TempDir()
	if err := os.Mkdir(filepath.Join(rootPath, "C:"), 0o700); err != nil {
		t.Fatal(err)
	}
	mustWriteFile(t, filepath.Join(rootPath, "C:", "payload"), "content")
	mustWriteFile(t, filepath.Join(rootPath, "..\\outside"), "content")
	target, err := OpenTarget(rootPath)
	if err != nil {
		t.Fatal(err)
	}
	defer target.Close()
	for _, name := range []RelativePath{"C:/payload", "..\\outside"} {
		if _, err := target.PrepareArchive(context.Background(), []RelativePath{name}); !errors.Is(err, ErrArchiveName) {
			t.Errorf("unsafe ZIP name %q = %v, want ErrArchiveName", name, err)
		}
	}
}

func TestArchiveRejectsFIFOBeforeStreaming(t *testing.T) {
	rootPath := t.TempDir()
	if err := syscall.Mkfifo(filepath.Join(rootPath, "pipe"), 0o600); err != nil {
		t.Skipf("cannot create FIFO: %v", err)
	}
	target, err := OpenTarget(rootPath)
	if err != nil {
		t.Fatal(err)
	}
	defer target.Close()
	done := make(chan error, 1)
	go func() {
		_, err := target.PrepareArchive(context.Background(), []RelativePath{"."})
		done <- err
	}()
	select {
	case err := <-done:
		if !errors.Is(err, ErrNotRegular) {
			t.Fatalf("FIFO archive = %v, want ErrNotRegular", err)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("archive preflight blocked on FIFO")
	}
}
