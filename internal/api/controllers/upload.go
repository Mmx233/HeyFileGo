package controllers

import (
	"errors"
	"io/fs"
	"log/slog"

	"github.com/Mmx233/HeyFileGo/v2/internal/api/callback"
	"github.com/Mmx233/HeyFileGo/v2/internal/share"
	"github.com/gin-gonic/gin"
)

func (h *Controller) Upload(c *gin.Context) {
	f, err := c.FormFile("file")
	if err != nil {
		callback.ErrorWithTip(c, callback.ErrForm, "Failed to read form file", err)
		return
	}

	src, err := f.Open()
	if err != nil {
		callback.Error(c, callback.ErrFileOperation, err)
		return
	}
	defer src.Close()

	if err = h.target.SaveUpload(f.Filename, src); err != nil {
		switch {
		case errors.Is(err, share.ErrInvalidPath):
			callback.ErrorWithTip(c, callback.ErrForm, "Invalid file name", err)
		case errors.Is(err, fs.ErrExist):
			callback.Error(c, callback.ErrFileExists, err)
		default:
			callback.Error(c, callback.ErrFileOperation, err)
		}
		return
	}

	slog.Info("File " + f.Filename + " saved")
	callback.Default(c)
}
