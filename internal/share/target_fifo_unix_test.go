//go:build unix

package share

import (
	"errors"
	"os"
	"path/filepath"
	"syscall"
	"testing"
	"time"
)

func completeWithin(t *testing.T, operation func() error) error {
	t.Helper()
	done := make(chan error, 1)
	go func() {
		done <- operation()
	}()
	select {
	case err := <-done:
		return err
	case <-time.After(2 * time.Second):
		t.Fatal("file operation blocked on a special file")
		return nil
	}
}

func TestFIFOIsRejectedWithoutBlocking(t *testing.T) {
	rootPath := t.TempDir()
	fifoPath := filepath.Join(rootPath, "pipe")
	if err := syscall.Mkfifo(fifoPath, 0o600); err != nil {
		t.Skipf("cannot create FIFO: %v", err)
	}

	target, err := OpenTarget(rootPath)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { target.Close() })

	pipe := mustRelativePath(t, "pipe")
	if err := completeWithin(t, func() error {
		info, err := target.EntryInfo(pipe)
		if err == nil && info.Mode()&os.ModeNamedPipe == 0 {
			return errors.New("FIFO was not identified as a named pipe")
		}
		return err
	}); err != nil {
		t.Fatal(err)
	}
	if err := completeWithin(t, func() error {
		file, _, err := target.OpenRegular(pipe)
		if file != nil {
			file.Close()
		}
		if !errors.Is(err, ErrNotRegular) {
			return errors.New("FIFO was not rejected as a non-regular file")
		}
		return nil
	}); err != nil {
		t.Fatal(err)
	}

	linkPath := filepath.Join(rootPath, "pipe-link")
	if err := os.Symlink("pipe", linkPath); err == nil {
		if err := completeWithin(t, func() error {
			file, _, err := target.OpenRegular(mustRelativePath(t, "pipe-link"))
			if file != nil {
				file.Close()
			}
			if !errors.Is(err, ErrNotRegular) {
				return errors.New("symlink to FIFO was not rejected")
			}
			return nil
		}); err != nil {
			t.Fatal(err)
		}
	}
}

func TestOpenTargetRejectsFIFOWithoutBlocking(t *testing.T) {
	fifoPath := filepath.Join(t.TempDir(), "pipe")
	if err := syscall.Mkfifo(fifoPath, 0o600); err != nil {
		t.Skipf("cannot create FIFO: %v", err)
	}
	if err := completeWithin(t, func() error {
		target, err := OpenTarget(fifoPath)
		if target != nil {
			target.Close()
		}
		if !errors.Is(err, ErrNotRegular) {
			return errors.New("FIFO target was not rejected")
		}
		return nil
	}); err != nil {
		t.Fatal(err)
	}
}
