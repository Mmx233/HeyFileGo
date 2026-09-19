package share

import (
	"archive/zip"
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path"
	"slices"
	"strings"
)

var (
	ErrArchiveCycle   = errors.New("directory contains a link cycle")
	ErrArchiveChanged = errors.New("an archive entry changed during download")
	ErrArchiveName    = errors.New("entry name cannot be safely represented in a ZIP archive")
)

type archiveEntry struct {
	path RelativePath
	name string
	info fs.FileInfo
}

// Archive holds only entry names and metadata. File content is never buffered.
// The source is a live filesystem, so this is not an immutable snapshot.
type Archive struct {
	target  *Target
	entries []archiveEntry
	Name    string
}

func (t *Target) PrepareArchive(ctx context.Context, paths []RelativePath) (*Archive, error) {
	if t.mode != ModeDir || t.root == nil {
		return nil, ErrWrongMode
	}
	if len(paths) == 0 {
		return nil, ErrInvalidPath
	}
	paths = slices.Clone(paths)
	slices.Sort(paths)
	unique := make([]RelativePath, 0, len(paths))
	seen := make(map[RelativePath]bool, len(paths))
	for _, selected := range paths {
		parsed, err := ParseRelativePath(selected.String())
		if err != nil || parsed != selected {
			return nil, ErrInvalidPath
		}
		covered := seen["."] || seen[selected]
		for parent := path.Dir(selected.String()); !covered && parent != "."; parent = path.Dir(parent) {
			covered = seen[RelativePath(parent)]
		}
		if covered {
			continue
		}
		unique = append(unique, selected)
		seen[selected] = true
	}
	rootName := t.DisplayName()
	if rootName == "" || rootName == "." || strings.ContainsAny(rootName, "/\\:") {
		rootName = "download"
	}
	archive := &Archive{target: t, Name: rootName + ".zip"}
	if len(unique) == 1 && unique[0] != "." {
		archive.Name = unique[0].Base() + ".zip"
	}
	for _, selected := range unique {
		name := selected.String()
		if selected == "." {
			name = rootName
		}
		if err := archive.walk(ctx, selected, name, nil); err != nil {
			return nil, err
		}
	}
	return archive, nil
}

func (a *Archive) walk(ctx context.Context, selected RelativePath, name string, parents []fs.FileInfo) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	// ZIP names must be relative on Windows as well as Unix. Backslashes can
	// become traversal separators, and a drive prefix changes the destination.
	hasDrivePrefix := len(name) >= 2 && name[1] == ':' &&
		((name[0] >= 'A' && name[0] <= 'Z') || (name[0] >= 'a' && name[0] <= 'z'))
	if !fs.ValidPath(name) || strings.ContainsRune(name, '\\') || hasDrivePrefix {
		return ErrArchiveName
	}
	info, err := a.target.EntryInfo(selected)
	if err != nil {
		return err
	}
	if !info.IsDir() {
		file, info, err := a.target.OpenRegular(selected)
		if err != nil {
			return err
		}
		if err := file.Close(); err != nil {
			return err
		}
		a.entries = append(a.entries, archiveEntry{path: selected, name: name, info: info})
		return nil
	}
	directory, err := a.target.OpenDirectory(selected)
	if err != nil {
		return err
	}
	defer directory.Close()
	info, err = directory.Stat()
	if err != nil {
		return err
	}
	for _, parent := range parents {
		if os.SameFile(info, parent) {
			return ErrArchiveCycle
		}
	}
	a.entries = append(a.entries, archiveEntry{path: selected, name: name + "/", info: info})
	parents = append(parents, info)
	for {
		children, readErr := directory.ReadDir(256)
		if readErr != nil && !errors.Is(readErr, io.EOF) {
			return readErr
		}
		for _, child := range children {
			childPath, err := selected.Join(child.Name())
			if err != nil {
				return err
			}
			if err := a.walk(ctx, childPath, path.Join(name, child.Name()), parents); err != nil {
				return err
			}
		}
		if errors.Is(readErr, io.EOF) {
			return nil
		}
	}
}

func sameArchiveEntry(before, after fs.FileInfo) bool {
	return os.SameFile(before, after) && before.Mode() == after.Mode() &&
		before.Size() == after.Size() && before.ModTime().Equal(after.ModTime())
}

// Write streams a ZIP and closes its central directory only after every entry
// succeeds. Callers must abort the HTTP stream on errors after headers are sent.
func (a *Archive) Write(ctx context.Context, destination io.Writer) error {
	writer := zip.NewWriter(destination)
	for _, entry := range a.entries {
		if err := ctx.Err(); err != nil {
			return err
		}
		if err := a.writeEntry(ctx, writer, entry); err != nil {
			return err
		}
	}
	// Catch replacements and directory membership changes since preflight.
	for _, entry := range a.entries {
		if err := ctx.Err(); err != nil {
			return err
		}
		info, err := a.target.EntryInfo(entry.path)
		if err != nil {
			return err
		}
		if !sameArchiveEntry(entry.info, info) {
			return ErrArchiveChanged
		}
	}
	return writer.Close()
}

func (a *Archive) writeEntry(ctx context.Context, writer *zip.Writer, entry archiveEntry) error {
	info, err := a.target.EntryInfo(entry.path)
	if err != nil {
		return err
	}
	if !sameArchiveEntry(entry.info, info) {
		return ErrArchiveChanged
	}
	var file *os.File
	if !info.IsDir() {
		file, info, err = a.target.OpenRegular(entry.path)
		if err != nil {
			return err
		}
		defer file.Close()
		if !sameArchiveEntry(entry.info, info) {
			return ErrArchiveChanged
		}
	}
	header, err := zip.FileInfoHeader(info)
	if err != nil {
		return err
	}
	header.Name = entry.name
	if !info.IsDir() {
		header.Method = zip.Deflate
	}
	content, err := writer.CreateHeader(header)
	if err != nil || info.IsDir() {
		return err
	}
	if _, err := io.CopyN(content, archiveReader{ctx: ctx, source: file}, info.Size()); err != nil {
		return fmt.Errorf("archive read: %w", err)
	}
	after, err := file.Stat()
	if err != nil {
		return err
	}
	if !sameArchiveEntry(info, after) {
		return ErrArchiveChanged
	}
	return nil
}

type archiveReader struct {
	ctx    context.Context
	source io.Reader
}

func (r archiveReader) Read(buffer []byte) (int, error) {
	if err := r.ctx.Err(); err != nil {
		return 0, err
	}
	return r.source.Read(buffer)
}
