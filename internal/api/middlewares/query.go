package middlewares

import (
	"net/url"

	"github.com/Mmx233/HeyFileGo/v2/internal/api/callback"
	"github.com/Mmx233/HeyFileGo/v2/internal/share"
	"github.com/gin-gonic/gin"
)

const queryPathKey = "heyfilego.relative-path"

func DecodeQueryPath(c *gin.Context) {
	values, err := url.ParseQuery(c.Request.URL.RawQuery)
	if err != nil {
		callback.Error(c, callback.ErrInvalidPath, err)
		return
	}

	pathValues, hasPath := values["path"]
	if c.Request.URL.RawQuery != "" && !hasPath {
		callback.Error(c, callback.ErrInvalidPath)
		return
	}
	if len(pathValues) > 1 {
		callback.Error(c, callback.ErrInvalidPath)
		return
	}

	value := ""
	if len(pathValues) == 1 {
		value = pathValues[0]
	}
	relativePath, err := share.ParseRelativePath(value)
	if err != nil {
		callback.Error(c, callback.ErrInvalidPath, err)
		return
	}
	c.Set(queryPathKey, relativePath)
}

func QueryPath(c *gin.Context) (share.RelativePath, bool) {
	value, exists := c.Get(queryPathKey)
	if !exists {
		return "", false
	}
	path, ok := value.(share.RelativePath)
	return path, ok
}
