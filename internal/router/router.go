package router

import (
	api "github.com/Mmx233/HeyFileGo/v2/internal/api/router"
	"github.com/Mmx233/HeyFileGo/v2/internal/config"
	"github.com/gin-gonic/gin"
)

func Init() *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	E := gin.New()
	E.Use(gin.Recovery())

	api.Init(E.Group("api"))

	E.Use(func(c *gin.Context) {
		if c.Request.URL.Path == "/" && !c.IsWebsocket() && c.Request.URL.RawQuery != config.Mode {
			c.Redirect(302, "?"+config.Mode)
			return
		}
	})
	E.Use(frontendHandler())

	return E
}
