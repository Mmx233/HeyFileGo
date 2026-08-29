package share

import (
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
)

type Mode string

const (
	ModeUpload Mode = "upload"
	ModeFile   Mode = "file"
	ModeDir    Mode = "dir"
)

var (
	ErrWrongMode    = errors.New("operation is unavailable in the current mode")
	ErrNotDirectory = errors.New("target is not a directory")
	ErrNotRegular   = errors.New("target is not a regular file")
)

// Target owns the operating-system handles that define the shared object.
// It is safe for concurrent reads and must remain open while handlers are active.
type Target struct {
	mode     Mode
	root     *os.Root
	file     *os.File
	fileName string
}

func OpenTarget(name string) (*Target, error) {
	if name == "" {
		return &Target{mode: ModeUpload}, nil
	}

	info, err := os.Stat(name)
	if err != nil {
		return nil, fmt.Errorf("stat target: %w", err)
	}
	if info.IsDir() {
		// A trailing separator makes the OS require a directory during the
		// open, so a concurrent replacement with a FIFO cannot block startup.
		rootName := name
		if !os.IsPathSeparator(rootName[len(rootName)-1]) {
			rootName += string(os.PathSeparator)
		}
		root, err := os.OpenRoot(rootName)
		if err != nil {
			return nil, fmt.Errorf("open directory target: %w", err)
		}
		return &Target{mode: ModeDir, root: root}, nil
	}

	file, err := openReadOnly(name)
	if err != nil {
		return nil, fmt.Errorf("open target: %w", err)
	}
	info, err = file.Stat()
	if err != nil {
		file.Close()
		return nil, fmt.Errorf("stat target: %w", err)
	}
	if !info.Mode().IsRegular() {
		file.Close()
		return nil, ErrNotRegular
	}

	return &Target{
		mode:     ModeFile,
		file:     file,
		fileName: info.Name(),
	}, nil
}

func (t *Target) Mode() Mode {
	return t.mode
}

func (t *Target) FileName() string {
	return t.fileName
}

func (t *Target) Close() error {
	var errs []error
	if t.root != nil {
		errs = append(errs, t.root.Close())
	}
	if t.file != nil {
		errs = append(errs, t.file.Close())
	}
	return errors.Join(errs...)
}

func (t *Target) OpenDirectory(name RelativePath) (*os.File, error) {
	if t.mode != ModeDir || t.root == nil {
		return nil, ErrWrongMode
	}
	dir, err := t.root.OpenRoot(name.String())
	if err != nil {
		if info, statErr := t.root.Stat(name.String()); statErr == nil && !info.IsDir() {
			return nil, ErrNotDirectory
		}
		return nil, err
	}
	defer dir.Close()

	file, err := dir.Open(".")
	if err != nil {
		return nil, err
	}
	return file, nil
}

// EntryInfo resolves name through the held root without opening special files.
func (t *Target) EntryInfo(name RelativePath) (fs.FileInfo, error) {
	if t.mode != ModeDir || t.root == nil {
		return nil, ErrWrongMode
	}
	return t.root.Stat(name.String())
}

func (t *Target) OpenRegular(name RelativePath) (*os.File, fs.FileInfo, error) {
	if t.mode != ModeDir || t.root == nil {
		return nil, nil, ErrWrongMode
	}
	file, err := openRootReadOnly(t.root, name.String())
	if err != nil {
		return nil, nil, err
	}
	info, err := file.Stat()
	if err != nil {
		file.Close()
		return nil, nil, err
	}
	if !info.Mode().IsRegular() {
		file.Close()
		return nil, info, ErrNotRegular
	}
	return file, info, nil
}

// SingleContent returns an independent seek position over the held file handle.
func (t *Target) SingleContent() (string, fs.FileInfo, io.ReadSeeker, error) {
	if t.mode != ModeFile || t.file == nil {
		return "", nil, nil, ErrWrongMode
	}
	info, err := t.file.Stat()
	if err != nil {
		return "", nil, nil, err
	}
	if !info.Mode().IsRegular() {
		return "", info, nil, ErrNotRegular
	}
	reader := io.NewSectionReader(t.file, 0, info.Size())
	return t.fileName, info, reader, nil
}
