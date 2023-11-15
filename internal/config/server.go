package config

import (
	"log"
	"os"
)

var Mode string
var Root *os.File

func initServer() {
	if Commands.Path == "" {
		Mode = ModeUpload
	} else {
		var err error
		Root, err = os.OpenFile(Commands.Path, os.O_RDONLY, 0600)
		if err != nil {
			log.Fatalln("读取目标路径失败:", err)
		}
		rootInfo, err := Root.Stat()
		if err != nil {
			log.Fatalln("读取路径信息失败:", err)
		}
		if rootInfo.IsDir() {
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
