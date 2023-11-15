package middlewares

import (
	"github.com/Mmx233/HeyFileGo/v2/internal/api/callback"
	"github.com/Mmx233/HeyFileGo/v2/internal/config"
	"github.com/gin-gonic/gin"
)

func MustMode(mode string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if config.Mode != mode {
			callback.Error(c, callback.ErrMode)
		}
	}
}
