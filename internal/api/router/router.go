package router

import (
	"github.com/Mmx233/HeyFileGo/v2/internal/api/controllers"
	"github.com/Mmx233/HeyFileGo/v2/internal/api/middlewares"
	"github.com/Mmx233/HeyFileGo/v2/internal/share"
	"github.com/gin-gonic/gin"
)

func Init(G *gin.RouterGroup, target *share.Target) {
	controller := controllers.New(target)
	G.GET("info", controller.Info)

	file := G.Group("file", middlewares.MustMode(target, share.ModeFile))
	file.GET("/", controller.DownloadFile)
	file.HEAD("/", controller.DownloadFile)
	file.GET("info", controller.FileInfo)

	G.POST("upload", middlewares.MustMode(target, share.ModeUpload), controller.Upload)
	G.POST("dir/archive", middlewares.MustMode(target, share.ModeDir), controller.DirArchive)

	dir := G.Group("dir",
		middlewares.MustMode(target, share.ModeDir),
		middlewares.DecodeQueryPath,
	)
	dir.GET("/", controller.DirContent)
	dir.GET("entries", controller.DirEntries)
	dir.GET("search", controller.DirSearch)
	dir.GET("file", controller.DirFileDownload)
	dir.HEAD("file", controller.DirFileDownload)
}
