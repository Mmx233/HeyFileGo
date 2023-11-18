package middlewares

import (
	"github.com/Mmx233/HeyFileGo/v2/internal/api/callback"
	"github.com/gin-gonic/gin"
	"net/url"
	"path"
	"strings"
)

func DecodeQueryPath(c *gin.Context) {
	if c.Request.URL.RawQuery != "" {
		var err error
		c.Request.URL.RawQuery, err = url.QueryUnescape(c.Request.URL.RawQuery)
		if err != nil {
			callback.Error(c, callback.ErrForm, err)
		}

		c.Request.URL.RawQuery = strings.Replace(c.Request.URL.RawQuery, "\\", "/", -1)
		if c.Request.URL.RawQuery[0] != '/' {
			c.Request.URL.RawQuery = "/" + c.Request.URL.RawQuery
		}
		c.Request.URL.RawQuery = path.Clean(c.Request.URL.RawQuery)
	}
}
