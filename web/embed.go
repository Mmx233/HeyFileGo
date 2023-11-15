//go:build !dev

package web

import (
	"embed"
	"io/fs"
)

//go:embed dist/*
var dist embed.FS

func Fs() (fs.FS, error) {
	return fs.Sub(dist, "dist")
}
