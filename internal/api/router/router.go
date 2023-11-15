package router

import (
	"github.com/Mmx233/HeyFileGo/v2/internal/api/controllers"
	"github.com/Mmx233/HeyFileGo/v2/internal/api/middlewares"
	"github.com/Mmx233/HeyFileGo/v2/internal/config"
	"github.com/gin-gonic/gin"
)

func Init(G *gin.RouterGroup) {
	file := G.Group("file", middlewares.MustMode(config.ModeFile))
	file.GET("/", controllers.DownloadFile)
	file.GET("info", controllers.FileInfo)

	G.POST("upload", middlewares.MustMode(config.ModeUpload), controllers.Upload)

	dir := G.Group("dir", middlewares.MustMode(config.ModeDir))
	dir.GET("/", controllers.DirContent)
	dir.POST("/", controllers.DirUpload)
	dir.GET("file", controllers.DirFileDownload)
}
