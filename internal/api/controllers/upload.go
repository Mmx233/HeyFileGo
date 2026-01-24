package controllers

import (
	"log/slog"
	"strings"

	"github.com/Mmx233/HeyFileGo/v2/internal/api/callback"
	"github.com/gin-gonic/gin"
)

func Upload(c *gin.Context) {
	f, err := c.FormFile("file")
	if err != nil {
		callback.ErrorWithTip(c, callback.ErrForm, "Failed to read form file", err)
		return
	}

	if f.Filename == "" ||
		strings.Contains(f.Filename, "/") || strings.Contains(f.Filename, "\\") {
		callback.ErrorWithTip(c, callback.ErrForm, "Invalid file name", err)
		return
	}

	if err = c.SaveUploadedFile(f, f.Filename); err != nil {
		callback.Error(c, callback.ErrFileOperation, err)
		return
	}

	slog.Info("File " + f.Filename + " saved")
	callback.Default(c)
}
