package share

import (
	"archive/zip"
	"bytes"
	"context"
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestArchivePreservesContentsAndDeduplicatesSelections(t *testing.T) {
	rootPath := t.TempDir()
	if err := os.MkdirAll(filepath.Join(rootPath, "folder", "empty"), 0o700); err != nil {
		t.Fatal(err)
	}
	mustWriteFile(t, filepath.Join(rootPath, "folder", "file+%& #文件.txt"), "content")
	mustWriteFile(t, filepath.Join(rootPath, "folder-other.txt"), "other")
	target, err := OpenTarget(rootPath)
	if err != nil {
		t.Fatal(err)
	}
	defer target.Close()
	archive, err := target.PrepareArchive(context.Background(), []RelativePath{
		"folder/file+%& #文件.txt", "folder", "folder-other.txt", "folder",
	})
	if err != nil {
		t.Fatal(err)
	}
	var buffer bytes.Buffer
	if err := archive.Write(context.Background(), &buffer); err != nil {
		t.Fatal(err)
	}
	reader, err := zip.NewReader(bytes.NewReader(buffer.Bytes()), int64(buffer.Len()))
	if err != nil {
		t.Fatal(err)
	}
	want := map[string]string{
		"folder/": "", "folder/empty/": "", "folder/file+%& #文件.txt": "content", "folder-other.txt": "other",
	}
	if len(reader.File) != len(want) {
		t.Fatalf("archive contains %d entries, want %d", len(reader.File), len(want))
	}
	for _, entry := range reader.File {
		expected, exists := want[entry.Name]
		if !exists {
			t.Fatalf("unexpected or duplicate ZIP entry %q", entry.Name)
		}
		delete(want, entry.Name)
		if strings.HasSuffix(entry.Name, "/") && !entry.FileInfo().IsDir() {
			t.Fatalf("directory lost its type: %s", entry.Name)
		}
		file, err := entry.Open()
		if err != nil {
			t.Fatal(err)
		}
		content, err := io.ReadAll(file)
		file.Close()
		if err != nil || string(content) != expected {
			t.Fatalf("entry %q = %q, %v", entry.Name, content, err)
		}
	}
	rootArchive, err := target.PrepareArchive(context.Background(), []RelativePath{"folder", "."})
	if err != nil {
		t.Fatal(err)
	}
	if len(rootArchive.entries) != 5 || rootArchive.entries[0].name != target.DisplayName()+"/" {
		t.Fatalf("root selection not wrapped or deduplicated: %#v", rootArchive.entries)
	}
}

func TestArchiveFailsOnChangedFilesAndCanceledContext(t *testing.T) {
	rootPath := t.TempDir()
	filePath := filepath.Join(rootPath, "file.txt")
	mustWriteFile(t, filePath, "original")
	target, err := OpenTarget(rootPath)
	if err != nil {
		t.Fatal(err)
	}
	defer target.Close()
	archive, err := target.PrepareArchive(context.Background(), []RelativePath{"."})
	if err != nil {
		t.Fatal(err)
	}
	mustWriteFile(t, filePath, "changed length")
	var buffer bytes.Buffer
	if err := archive.Write(context.Background(), &buffer); !errors.Is(err, ErrArchiveChanged) {
		t.Fatalf("changed file archive = %v, want ErrArchiveChanged", err)
	}
	if _, err := zip.NewReader(bytes.NewReader(buffer.Bytes()), int64(buffer.Len())); err == nil {
		t.Fatal("changed file produced a valid partial archive")
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := target.PrepareArchive(ctx, []RelativePath{"."}); !errors.Is(err, context.Canceled) {
		t.Fatalf("canceled preflight = %v", err)
	}
	archive, err = target.PrepareArchive(context.Background(), []RelativePath{"."})
	if err != nil {
		t.Fatal(err)
	}
	if err := archive.Write(ctx, io.Discard); !errors.Is(err, context.Canceled) {
		t.Fatalf("canceled stream = %v", err)
	}
	if _, err := target.PrepareArchive(context.Background(), []RelativePath{"../outside"}); !errors.Is(err, ErrInvalidPath) {
		t.Fatalf("traversal selection = %v", err)
	}
}

func TestArchiveRejectsCyclesAndOutsideLinks(t *testing.T) {
	base := t.TempDir()
	rootPath := filepath.Join(base, "root")
	if err := os.MkdirAll(filepath.Join(rootPath, "folder"), 0o700); err != nil {
		t.Fatal(err)
	}
	mustWriteFile(t, filepath.Join(rootPath, "inside.txt"), "inside")
	mustWriteFile(t, filepath.Join(base, "outside.txt"), "secret")
	if err := os.Symlink(".", filepath.Join(rootPath, "folder", "up")); err != nil {
		t.Skipf("symlinks are unavailable: %v", err)
	}
	if err := os.Symlink(filepath.Join(base, "outside.txt"), filepath.Join(rootPath, "outside")); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink("inside.txt", filepath.Join(rootPath, "inside-link")); err != nil {
		t.Fatal(err)
	}
	target, err := OpenTarget(rootPath)
	if err != nil {
		t.Fatal(err)
	}
	defer target.Close()
	if _, err := target.PrepareArchive(context.Background(), []RelativePath{"folder"}); !errors.Is(err, ErrArchiveCycle) {
		t.Fatalf("directory cycle preflight = %v, want ErrArchiveCycle", err)
	}
	if _, err := target.PrepareArchive(context.Background(), []RelativePath{"outside"}); err == nil {
		t.Fatal("archive followed an outside symlink")
	}
	archive, err := target.PrepareArchive(context.Background(), []RelativePath{"inside-link"})
	if err != nil {
		t.Fatalf("inside symlink was rejected: %v", err)
	}
	var buffer bytes.Buffer
	if err := archive.Write(context.Background(), &buffer); err != nil {
		t.Fatal(err)
	}
	reader, err := zip.NewReader(bytes.NewReader(buffer.Bytes()), int64(buffer.Len()))
	if err != nil || len(reader.File) != 1 || reader.File[0].Name != "inside-link" || reader.File[0].Mode()&os.ModeSymlink != 0 {
		t.Fatalf("inside symlink archive = %#v, %v", reader, err)
	}
}

func TestArchiveDoesNotFinalizeAfterWriteFailure(t *testing.T) {
	rootPath := t.TempDir()
	mustWriteFile(t, filepath.Join(rootPath, "file.txt"), "content")
	target, err := OpenTarget(rootPath)
	if err != nil {
		t.Fatal(err)
	}
	defer target.Close()
	archive, err := target.PrepareArchive(context.Background(), []RelativePath{"."})
	if err != nil {
		t.Fatal(err)
	}
	wantErr := errors.New("destination disconnected")
	if err := archive.Write(context.Background(), failingArchiveWriter{err: wantErr}); !errors.Is(err, wantErr) {
		t.Fatalf("write failure = %v", err)
	}
}

type failingArchiveWriter struct{ err error }

func (w failingArchiveWriter) Write([]byte) (int, error) { return 0, w.err }
