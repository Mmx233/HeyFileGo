package controllers

import (
	"io"
	"io/fs"
	"mime"
	"net/http"

	"github.com/gin-gonic/gin"
)

func serveAttachment(c *gin.Context, name string, info fs.FileInfo, content io.ReadSeeker) {
	disposition := mime.FormatMediaType("attachment", map[string]string{"filename": name})
	if disposition == "" {
		disposition = "attachment; filename=download"
	}
	c.Header("Content-Disposition", disposition)
	http.ServeContent(c.Writer, c.Request, name, info.ModTime(), content)
}
