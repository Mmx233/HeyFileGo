package controllers

import (
	"context"
	"time"

	"github.com/Mmx233/HeyFileGo/v2/internal/api/callback"
	"github.com/Mmx233/HeyFileGo/v2/internal/api/middlewares"
	"github.com/Mmx233/HeyFileGo/v2/internal/share"
	"github.com/gin-gonic/gin"
)

type File struct {
	Name       string    `json:"name"`
	IsDir      bool      `json:"is_dir"`
	Size       int64     `json:"size"`
	ModifiedAt time.Time `json:"modified_at"`
}

func (h *Controller) DirContent(c *gin.Context) {
	relativePath, ok := middlewares.QueryPath(c)
	if !ok {
		callback.Error(c, callback.ErrInvalidPath)
		return
	}

	fileInfos, err := h.directoryEntries(c.Request.Context(), relativePath)
	if err != nil {
		targetError(c, err)
		return
	}
	callback.Success(c, fileInfos)
}

func (h *Controller) directoryEntries(ctx context.Context, relativePath share.RelativePath) ([]File, error) {
	dir, err := h.target.OpenDirectory(relativePath)
	if err != nil {
		return nil, err
	}
	defer dir.Close()

	files, err := dir.ReadDir(-1)
	if err != nil {
		return nil, err
	}

	fileInfos := make([]File, 0, len(files))
	for _, file := range files {
		if err := ctx.Err(); err != nil {
			return nil, err
		}
		childPath, err := relativePath.Join(file.Name())
		if err != nil {
			continue
		}
		info, err := h.target.EntryInfo(childPath)
		if err != nil || (!info.IsDir() && !info.Mode().IsRegular()) {
			continue
		}
		fileInfo := File{
			Name:       file.Name(),
			IsDir:      info.IsDir(),
			ModifiedAt: info.ModTime().UTC(),
		}
		if !fileInfo.IsDir {
			fileInfo.Size = info.Size()
		}
		fileInfos = append(fileInfos, fileInfo)
	}

	return fileInfos, nil
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
