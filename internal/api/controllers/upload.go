package controllers

import (
	"errors"
	"io"
	"io/fs"
	"log/slog"

	"github.com/Mmx233/HeyFileGo/v2/internal/api/callback"
	"github.com/Mmx233/HeyFileGo/v2/internal/share"
	"github.com/gin-gonic/gin"
)

func (h *Controller) Upload(c *gin.Context) {
	reader, err := c.Request.MultipartReader()
	if err != nil {
		callback.ErrorWithTip(c, callback.ErrForm, "Failed to read form file", err)
		return
	}

	for {
		part, err := reader.NextPart()
		if err != nil {
			callback.ErrorWithTip(c, callback.ErrForm, "Failed to read form file", err)
			return
		}
		name := part.FileName()
		if part.FormName() != "file" || name == "" {
			continue
		}

		if err = h.target.SaveUpload(name, part); err != nil {
			switch {
			case errors.Is(err, share.ErrInvalidPath):
				callback.ErrorWithTip(c, callback.ErrForm, "Invalid file name", err)
			case errors.Is(err, io.ErrUnexpectedEOF):
				callback.ErrorWithTip(c, callback.ErrForm, "Failed to read form file", err)
			case errors.Is(err, fs.ErrExist):
				callback.Error(c, callback.ErrFileExists, err)
			default:
				callback.Error(c, callback.ErrFileOperation, err)
			}
			return
		}

		slog.Info("File " + name + " saved")
		callback.Default(c)
		return
	}
}
