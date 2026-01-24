package config

import (
	"log/slog"
	"os"
)

var Mode string

var FileInfo os.FileInfo

func initServer() {
	if Commands.Path == "" {
		Mode = ModeUpload
	} else {
		rootFile, err := os.OpenFile(Commands.Path, os.O_RDONLY, 0600)
		if err != nil {
			slog.Error("Failed to read target path", "err", err)
			os.Exit(1)
		}
		defer rootFile.Close()
		FileInfo, err = rootFile.Stat()
		if err != nil {
			slog.Error("Failed to read path info", "err", err)
			os.Exit(1)
		}
		if FileInfo.IsDir() {
			Mode = ModeDir
		} else {
			Mode = ModeFile
		}
	}

	slog.Info("Running mode: " + Mode)
}

const (
	ModeUpload = "upload"
	ModeFile   = "file"
	ModeDir    = "dir"
)
