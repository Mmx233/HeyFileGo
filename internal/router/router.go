package router

import (
	api "github.com/Mmx233/HeyFileGo/v2/internal/api/router"
	"github.com/Mmx233/HeyFileGo/v2/internal/share"
	"github.com/gin-gonic/gin"
)

func Init(target *share.Target) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	E := gin.New()
	E.Use(gin.Recovery())

	api.Init(E.Group("api"), target)

	E.Use(func(c *gin.Context) {
		mode := string(target.Mode())
		if c.Request.URL.Path == "/" && !c.IsWebsocket() && c.Request.URL.RawQuery != mode {
			c.Redirect(302, "?"+mode)
			return
		}
	})
	E.Use(frontendHandler())

	return E
}
