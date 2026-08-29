package middlewares

import (
	"github.com/Mmx233/HeyFileGo/v2/internal/api/callback"
	"github.com/Mmx233/HeyFileGo/v2/internal/share"
	"github.com/gin-gonic/gin"
)

func MustMode(target *share.Target, mode share.Mode) gin.HandlerFunc {
	return func(c *gin.Context) {
		if target.Mode() != mode {
			callback.Error(c, callback.ErrMode)
			return
		}
	}
}
