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
}
