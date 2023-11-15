package config

import (
	"log"
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
			log.Fatalln("读取目标路径失败:", err)
		}
		defer rootFile.Close()
		FileInfo, err = rootFile.Stat()
		if err != nil {
			log.Fatalln("读取路径信息失败:", err)
		}
		if FileInfo.IsDir() {
			Mode = ModeDir
			Mode = ModeFile
		}
	}
}

const (
	ModeUpload = "upload"
	ModeFile   = "file"
	ModeDir    = "dir"
)
