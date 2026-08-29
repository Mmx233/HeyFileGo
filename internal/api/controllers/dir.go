package controllers

import (
	"github.com/Mmx233/HeyFileGo/v2/internal/api/callback"
	"github.com/Mmx233/HeyFileGo/v2/internal/api/middlewares"
	"github.com/gin-gonic/gin"
)

type File struct {
	Name  string `json:"name"`
	IsDir bool   `json:"is_dir"`
	Size  int64  `json:"size,omitempty"`
}

func (h *Controller) DirContent(c *gin.Context) {
	relativePath, ok := middlewares.QueryPath(c)
	if !ok {
		callback.Error(c, callback.ErrInvalidPath)
		return
	}

	dir, err := h.target.OpenDirectory(relativePath)
	if err != nil {
		targetError(c, err)
		return
	}
	defer dir.Close()

	files, err := dir.ReadDir(-1)
	if err != nil {
		callback.Error(c, callback.ErrFileOperation, err)
		return
	}

	fileInfos := make([]File, 0, len(files))
	for _, file := range files {
		childPath, err := relativePath.Join(file.Name())
		if err != nil {
			continue
		}
		info, err := h.target.EntryInfo(childPath)
		if err != nil || (!info.IsDir() && !info.Mode().IsRegular()) {
			continue
		}
		fileInfo := File{
			Name:  file.Name(),
			IsDir: info.IsDir(),
		}
		if !fileInfo.IsDir {
			fileInfo.Size = info.Size()
		}
		fileInfos = append(fileInfos, fileInfo)
	}

	callback.Success(c, fileInfos)
}

func (h *Controller) DirFileDownload(c *gin.Context) {
	relativePath, ok := middlewares.QueryPath(c)
	if !ok {
		callback.Error(c, callback.ErrInvalidPath)
		return
	}

	file, info, err := h.target.OpenRegular(relativePath)
	if err != nil {
		targetError(c, err)
		return
	}
	defer file.Close()
	serveAttachment(c, relativePath.Base(), info, file)
}
