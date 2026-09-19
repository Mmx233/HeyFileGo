package controllers

import (
	"io"
	"log/slog"
	"mime"
	"net/http"
	"net/url"
	"strings"

	"github.com/Mmx233/HeyFileGo/v2/internal/api/callback"
	"github.com/Mmx233/HeyFileGo/v2/internal/share"
	"github.com/gin-gonic/gin"
)

func (h *Controller) DirArchive(c *gin.Context) {
	mediaType, _, err := mime.ParseMediaType(c.GetHeader("Content-Type"))
	if err != nil || mediaType != "application/x-www-form-urlencoded" {
		callback.Error(c, callback.ErrForm)
		return
	}
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 1<<20)
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		callback.Error(c, callback.ErrForm)
		return
	}
	// Parse this single-field form within the byte limit. ParseForm also applies
	// a global URL parameter-count limit, which would cap cross-page selections.
	var paths []share.RelativePath
	for field := range strings.SplitSeq(string(body), "&") {
		if field == "" {
			continue
		}
		key, value, _ := strings.Cut(field, "=")
		key, keyErr := url.QueryUnescape(key)
		value, valueErr := url.QueryUnescape(value)
		if keyErr != nil || valueErr != nil || key != "path" || strings.ContainsRune(field, ';') {
			callback.Error(c, callback.ErrForm)
			return
		}
		parsed, err := share.ParseRelativePath(value)
		if err != nil {
			callback.Error(c, callback.ErrInvalidPath)
			return
		}
		paths = append(paths, parsed)
	}
	if len(paths) == 0 {
		callback.Error(c, callback.ErrForm)
		return
	}
	archive, err := h.target.PrepareArchive(c.Request.Context(), paths)
	if err != nil {
		callback.ErrorWithTip(c, callback.ErrFileOperation,
			"Archive could not be created. A selected entry is unavailable or cannot be archived; no files were skipped.", err)
		return
	}
	c.Header("Content-Type", "application/zip")
	c.Header("Content-Disposition", mime.FormatMediaType("attachment", map[string]string{"filename": archive.Name}))
	c.Header("Cache-Control", "no-store")
	if err := archive.Write(c.Request.Context(), c.Writer); err != nil {
		slog.Error("Archive download failed", "error", err)
		if !c.Writer.Written() {
			c.Header("Content-Disposition", "")
			c.Header("Content-Type", "")
			callback.ErrorWithTip(c, callback.ErrFileOperation,
				"Archive download failed because an entry changed or could not be read. Please retry.")
			return
		}
		// Do not finalize a partial ZIP or a successful HTTP response.
		panic(http.ErrAbortHandler)
	}
	c.Abort()
}
