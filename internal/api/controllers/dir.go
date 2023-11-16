package controllers

import (
	"github.com/Mmx233/HeyFileGo/v2/internal/api/callback"
	"github.com/Mmx233/HeyFileGo/v2/internal/config"
	"github.com/gin-gonic/gin"
	"log/slog"
	"os"
	"path"
)

type File struct {
	Name  string `json:"name"`
	IsDir bool   `json:"is_dir"`
	Size  int64  `json:"size,omitempty"`
}

func DirContent(c *gin.Context) {
	var dirPath = path.Join(config.Commands.Path, c.Request.URL.RawQuery)

	dir, err := os.OpenFile(dirPath, os.O_RDONLY, 0600)
	if err != nil {
		callback.Error(c, callback.ErrFileOperation, err)
		return
	}
	defer dir.Close()

	dirInfo, err := dir.Stat()
	if err != nil {
		callback.Error(c, callback.ErrFileOperation, err)
		return
	} else if !dirInfo.IsDir() {
		callback.Error(c, callback.ErrNotDir)
		return
	}

	files, err := dir.Readdir(0)
	if err != nil {
		callback.Error(c, callback.ErrFileOperation, err)
		return
	}

	fileInfos := make([]File, len(files))
	for i, file := range files {
		fileInfo := File{
			Name:  file.Name(),
			IsDir: file.IsDir(),
		}
		if !fileInfo.IsDir {
			fileInfo.Size = file.Size()
		}
		fileInfos[i] = fileInfo
	}

	callback.Success(c, fileInfos)
}

func DirUpload(c *gin.Context) {
	f, err := c.FormFile("file")
	if err != nil {
		callback.ErrorWithTip(c, callback.ErrForm, "读取表单文件失败", err)
		return
	}

	var targetPath = path.Join(config.Commands.Path, c.Request.URL.RawQuery, f.Filename)

	if err = c.SaveUploadedFile(f, targetPath); err != nil {
		callback.Error(c, callback.ErrFileOperation, err)
		return
	}

	slog.Info("文件 " + f.Filename + " 已上传到 " + c.Request.URL.RawQuery)
	callback.Default(c)
}

func DirFileDownload(c *gin.Context) {
	var targetPath = path.Join(config.Commands.Path, c.Request.URL.RawQuery)
	fileState, err := os.Stat(targetPath)
	if err != nil {
		if os.IsNotExist(err) {
			callback.Error(c, callback.ErrFileNotFound)
			return
		}
		callback.Error(c, callback.ErrFileOperation, err)
		return
	}
	if fileState.IsDir() {
		callback.Error(c, callback.ErrNotFile)
		return
	}

	c.File(targetPath)
}
