package share

import (
	"errors"
	"io/fs"
	"path"
	"path/filepath"
	"strings"
)

var ErrInvalidPath = errors.New("invalid relative path")

// RelativePath is a canonical, slash-separated path within a directory target.
// The value "." identifies the target root.
type RelativePath string

func ParseRelativePath(value string) (RelativePath, error) {
	if value == "" || value == "." {
		return ".", nil
	}
	if strings.IndexByte(value, 0) >= 0 || !fs.ValidPath(value) {
		return "", ErrInvalidPath
	}
	if _, err := filepath.Localize(value); err != nil {
		return "", ErrInvalidPath
	}
	return RelativePath(value), nil
}

func (p RelativePath) String() string {
	return string(p)
}

func (p RelativePath) Base() string {
	return path.Base(string(p))
}

func (p RelativePath) Join(name string) (RelativePath, error) {
	if name == "" || strings.ContainsRune(name, '/') {
		return "", ErrInvalidPath
	}
	joined := name
	if p != "." {
		joined = path.Join(string(p), name)
	}
	return ParseRelativePath(joined)
}
