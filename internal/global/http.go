package global

import "github.com/gin-gonic/gin"

var G *gin.Engine

func init() {
	gin.SetMode(gin.ReleaseMode)
	G = gin.New()
	G.Use(gin.Recovery())
}
