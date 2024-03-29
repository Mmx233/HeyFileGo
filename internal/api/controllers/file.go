package controllers

import (
	"github.com/Mmx233/HeyFileGo/v2/internal/api/callback"
	"github.com/Mmx233/HeyFileGo/v2/internal/config"
	"github.com/gin-gonic/gin"
)

func DownloadFile(c *gin.Context) {
	c.FileAttachment(config.Commands.Path, config.FileInfo.Name())
}

func FileInfo(c *gin.Context) {
	callback.Success(c, gin.H{
		"name": config.FileInfo.Name(),
		"size": config.FileInfo.Size(),
	})
}
