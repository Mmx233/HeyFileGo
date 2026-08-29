package controllers

import (
	"github.com/Mmx233/HeyFileGo/v2/internal/api/callback"
	"github.com/gin-gonic/gin"
)

func (h *Controller) DownloadFile(c *gin.Context) {
	name, info, content, err := h.target.SingleContent()
	if err != nil {
		callback.Error(c, callback.ErrFileOperation, err)
		return
	}
	serveAttachment(c, name, info, content)
}

func (h *Controller) FileInfo(c *gin.Context) {
	name, info, _, err := h.target.SingleContent()
	if err != nil {
		callback.Error(c, callback.ErrFileOperation, err)
		return
	}
	callback.Success(c, gin.H{
		"name": name,
		"size": info.Size(),
	})
}
