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
			slog.Error("读取目标路径失败", "err", err)
			os.Exit(1)
		}
		defer rootFile.Close()
		FileInfo, err = rootFile.Stat()
		if err != nil {
			slog.Error("读取路径信息失败", "err", err)
			os.Exit(1)
		}
		if FileInfo.IsDir() {
			Mode = ModeDir
		} else {
			Mode = ModeFile
		}
	}

	slog.Info("运行模式: " + Mode)
}

const (
	ModeUpload = "upload"
	ModeFile   = "file"
	ModeDir    = "dir"
)
