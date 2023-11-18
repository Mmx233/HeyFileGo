package middlewares

import (
	"github.com/Mmx233/HeyFileGo/v2/internal/api/callback"
	"github.com/gin-gonic/gin"
	"net/url"
	"path"
)

func DecodeQuery(c *gin.Context) {
	if c.Request.URL.RawQuery != "" {
		var err error
		c.Request.URL.RawQuery, err = url.QueryUnescape(c.Request.URL.RawQuery)
		if err != nil {
			callback.Error(c, callback.ErrForm, err)
		}
		c.Request.URL.RawQuery = path.Clean(c.Request.URL.RawQuery)
	}
}