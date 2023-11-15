package router

import (
	api "github.com/Mmx233/HeyFileGo/v2/internal/api/router"
	"github.com/gin-gonic/gin"
)

var E *gin.Engine

func init() {
	gin.SetMode(gin.ReleaseMode)
	E = gin.New()
	E.Use(gin.Recovery())

	api.Init(E.Group("api"))
	E.Use(frontendHandler())
}
