package share

import (
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"testing/iotest"
)

func mustWriteFile(t *testing.T, name, content string) {
	t.Helper()
	if err := os.WriteFile(name, []byte(content), 0o600); err != nil {
		t.Fatal(err)
	}
}

func mustRelativePath(t *testing.T, value string) RelativePath {
	t.Helper()
	name, err := ParseRelativePath(value)
	if err != nil {
		t.Fatalf("ParseRelativePath(%q): %v", value, err)
	}
	return name
}

func TestUploadTargetKeepsDirectoryAndCleansFailedWrites(t *testing.T) {
	rootPath := t.TempDir()
	otherPath := t.TempDir()
	t.Chdir(rootPath)
	target, err := OpenTarget("")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { target.Close() })
	t.Chdir(otherPath)

	wantErr := errors.New("read failed")
	src := io.MultiReader(strings.NewReader("partial"), iotest.ErrReader(wantErr))
	if err := target.SaveUpload("file.txt", src); !errors.Is(err, wantErr) {
		t.Fatalf("failed upload error = %v, want %v", err, wantErr)
	}
	if _, err := os.Lstat(filepath.Join(rootPath, "file.txt")); !errors.Is(err, fs.ErrNotExist) {
		t.Fatalf("partial file was not removed: %v", err)
	}
	if err := target.SaveUpload("file.txt", strings.NewReader("complete")); err != nil {
		t.Fatal(err)
	}
	content, err := os.ReadFile(filepath.Join(rootPath, "file.txt"))
	if err != nil || string(content) != "complete" {
		t.Fatalf("saved content = %q, %v", content, err)
	}
	if _, err := os.Lstat(filepath.Join(otherPath, "file.txt")); !errors.Is(err, fs.ErrNotExist) {
		t.Fatalf("upload followed the changed working directory: %v", err)
	}
}

func TestUploadRejectsInvalidNames(t *testing.T) {
	t.Chdir(t.TempDir())
	target, err := OpenTarget("")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { target.Close() })
	names := []string{"", ".", "..", "../outside", "/absolute", "nested/file", "nested\\file", "file\x00name"}
	if runtime.GOOS == "windows" {
		names = append(names, "NUL", "COM1", "file:stream", "C:file")
	}
	for _, name := range names {
		if err := target.SaveUpload(name, strings.NewReader("content")); !errors.Is(err, ErrInvalidPath) {
			t.Errorf("SaveUpload(%q) = %v, want ErrInvalidPath", name, err)
		}
	}
}

func TestParseRelativePath(t *testing.T) {
	for _, valid := range []string{
		"", ".", "file.txt", "nested/file.txt", "space name",
		"literal+plus", "literal%41", "hash#name", "amp&equals=",
	} {
		if _, err := ParseRelativePath(valid); err != nil {
			t.Errorf("ParseRelativePath(%q) returned %v", valid, err)
		}
	}
	for _, invalid := range []string{"../file", "/absolute", "nested/../file", "nested//file", "nested/./file", "file\x00name"} {
		if _, err := ParseRelativePath(invalid); err == nil {
			t.Errorf("ParseRelativePath(%q) succeeded", invalid)
		}
	}
}

func TestDirectoryTargetUsesRootedHandles(t *testing.T) {
	base := t.TempDir()
	rootPath := filepath.Join(base, "root")
	if err := os.MkdirAll(filepath.Join(rootPath, "nested"), 0o700); err != nil {
		t.Fatal(err)
	}
	mustWriteFile(t, filepath.Join(rootPath, "nested", "file.txt"), "inside")

	target, err := OpenTarget(rootPath)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { target.Close() })
	if target.Mode() != ModeDir {
		t.Fatalf("Mode() = %q, want %q", target.Mode(), ModeDir)
	}

	dir, err := target.OpenDirectory(mustRelativePath(t, "nested"))
	if err != nil {
		t.Fatal(err)
	}
	entries, err := dir.ReadDir(-1)
	dir.Close()
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 1 || entries[0].Name() != "file.txt" {
		t.Fatalf("ReadDir() = %v, want file.txt", entries)
	}

	file, info, err := target.OpenRegular(mustRelativePath(t, "nested/file.txt"))
	if err != nil {
		t.Fatal(err)
	}
	content, err := io.ReadAll(file)
	file.Close()
	if err != nil {
		t.Fatal(err)
	}
	if !info.Mode().IsRegular() || string(content) != "inside" {
		t.Fatalf("opened info/content = %v/%q", info.Mode(), content)
	}
}

func TestDirectoryTargetSymlinkPolicy(t *testing.T) {
	base := t.TempDir()
	rootPath := filepath.Join(base, "root")
	if err := os.MkdirAll(filepath.Join(rootPath, "nested"), 0o700); err != nil {
		t.Fatal(err)
	}
	mustWriteFile(t, filepath.Join(rootPath, "nested", "file.txt"), "inside")
	mustWriteFile(t, filepath.Join(base, "outside.txt"), "outside")

	insideLink := filepath.Join(rootPath, "inside-link")
	if err := os.Symlink(filepath.Join("nested", "file.txt"), insideLink); err != nil {
		t.Skipf("symlinks are unavailable: %v", err)
	}
	outsideLink := filepath.Join(rootPath, "outside-link")
	if err := os.Symlink(filepath.Join(base, "outside.txt"), outsideLink); err != nil {
		t.Skipf("cannot create outside symlink: %v", err)
	}
	relativeEscapeLink := filepath.Join(rootPath, "relative-escape-link")
	if err := os.Symlink(filepath.Join("..", "outside.txt"), relativeEscapeLink); err != nil {
		t.Skipf("cannot create relative escape symlink: %v", err)
	}
	if err := os.Symlink("missing.txt", filepath.Join(rootPath, "dangling-link")); err != nil {
		t.Skipf("cannot create dangling symlink: %v", err)
	}
	if err := os.Symlink("cycle-b", filepath.Join(rootPath, "cycle-a")); err != nil {
		t.Skipf("cannot create symlink cycle: %v", err)
	}
	if err := os.Symlink("cycle-a", filepath.Join(rootPath, "cycle-b")); err != nil {
		t.Skipf("cannot create symlink cycle: %v", err)
	}

	target, err := OpenTarget(rootPath)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { target.Close() })

	file, _, err := target.OpenRegular(mustRelativePath(t, "inside-link"))
	if err != nil {
		t.Fatalf("root-contained symlink was rejected: %v", err)
	}
	content, err := io.ReadAll(file)
	file.Close()
	if err != nil || string(content) != "inside" {
		t.Fatalf("contained symlink content = %q, %v", content, err)
	}

	for _, denied := range []string{"outside-link", "relative-escape-link", "dangling-link", "cycle-a"} {
		if file, _, err := target.OpenRegular(mustRelativePath(t, denied)); err == nil {
			file.Close()
			t.Fatalf("unsafe symlink %q was opened", denied)
		}
	}
}

func TestOpenTargetPinsSelectedSymlinkTarget(t *testing.T) {
	base := t.TempDir()
	directory := filepath.Join(base, "directory")
	if err := os.Mkdir(directory, 0o700); err != nil {
		t.Fatal(err)
	}
	filePath := filepath.Join(base, "file.txt")
	mustWriteFile(t, filePath, "content")

	directoryLink := filepath.Join(base, "directory-link")
	if err := os.Symlink("directory", directoryLink); err != nil {
		t.Skipf("symlinks are unavailable: %v", err)
	}
	fileLink := filepath.Join(base, "file-link")
	if err := os.Symlink("file.txt", fileLink); err != nil {
		t.Skipf("cannot create file symlink: %v", err)
	}

	directoryTarget, err := OpenTarget(directoryLink)
	if err != nil {
		t.Fatal(err)
	}
	if directoryTarget.Mode() != ModeDir {
		directoryTarget.Close()
		t.Fatalf("directory symlink mode = %q, want %q", directoryTarget.Mode(), ModeDir)
	}
	directoryTarget.Close()

	fileTarget, err := OpenTarget(fileLink)
	if err != nil {
		t.Fatal(err)
	}
	defer fileTarget.Close()
	if fileTarget.Mode() != ModeFile {
		t.Fatalf("file symlink mode = %q, want %q", fileTarget.Mode(), ModeFile)
	}
	_, _, content, err := fileTarget.SingleContent()
	if err != nil {
		t.Fatal(err)
	}
	got, err := io.ReadAll(content)
	if err != nil || string(got) != "content" {
		t.Fatalf("file symlink content = %q, %v", got, err)
	}
}

func TestOpenRegularKeepsCheckedHandle(t *testing.T) {
	rootPath := t.TempDir()
	path := filepath.Join(rootPath, "file.txt")
	mustWriteFile(t, path, "original")

	target, err := OpenTarget(rootPath)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { target.Close() })

	file, _, err := target.OpenRegular(mustRelativePath(t, "file.txt"))
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Rename(path, filepath.Join(rootPath, "original.txt")); err != nil {
		file.Close()
		t.Skipf("platform cannot rename an open file: %v", err)
	}
	mustWriteFile(t, path, "replacement")

	content, err := io.ReadAll(file)
	file.Close()
	if err != nil {
		t.Fatal(err)
	}
	if string(content) != "original" {
		t.Fatalf("opened handle returned %q, want original", content)
	}
}

func TestDirectoryTargetKeepsRootIdentity(t *testing.T) {
	base := t.TempDir()
	rootPath := filepath.Join(base, "root")
	if err := os.Mkdir(rootPath, 0o700); err != nil {
		t.Fatal(err)
	}
	mustWriteFile(t, filepath.Join(rootPath, "file.txt"), "original-root")

	target, err := OpenTarget(rootPath)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { target.Close() })

	movedPath := filepath.Join(base, "moved")
	err = os.Rename(rootPath, movedPath)
	if runtime.GOOS == "windows" {
		if err == nil {
			t.Fatal("renaming an open Windows root unexpectedly succeeded")
		}
	} else {
		if err != nil {
			t.Fatal(err)
		}
		if err := os.Mkdir(rootPath, 0o700); err != nil {
			t.Fatal(err)
		}
		mustWriteFile(t, filepath.Join(rootPath, "file.txt"), "replacement-root")
	}

	file, _, err := target.OpenRegular(mustRelativePath(t, "file.txt"))
	if err != nil {
		t.Fatal(err)
	}
	content, err := io.ReadAll(file)
	file.Close()
	if err != nil {
		t.Fatal(err)
	}
	if string(content) != "original-root" {
		t.Fatalf("root handle returned %q, want original-root", content)
	}
}

func TestSingleTargetKeepsIdentityAndIndependentReaders(t *testing.T) {
	base := t.TempDir()
	path := filepath.Join(base, "shared.bin")
	original := strings.Repeat("0123456789abcdef", 4096)
	mustWriteFile(t, path, original)

	target, err := OpenTarget(path)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { target.Close() })
	if target.Mode() != ModeFile {
		t.Fatalf("Mode() = %q, want %q", target.Mode(), ModeFile)
	}

	if err := os.Rename(path, filepath.Join(base, "original.bin")); err == nil {
		mustWriteFile(t, path, "replacement")
	} else if runtime.GOOS != "windows" {
		t.Fatal(err)
	}

	const readers = 16
	errs := make(chan error, readers)
	for range readers {
		go func() {
			_, _, reader, err := target.SingleContent()
			if err != nil {
				errs <- err
				return
			}
			content, err := io.ReadAll(reader)
			if err == nil && string(content) != original {
				err = fmt.Errorf("unexpected content length %d", len(content))
			}
			errs <- err
		}()
	}
	for range readers {
		if err := <-errs; err != nil {
			t.Fatal(err)
		}
	}
}
