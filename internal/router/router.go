package router

import (
	"errors"
	"log/slog"
	"net/http"
	"runtime/debug"

	api "github.com/Mmx233/HeyFileGo/v2/internal/api/router"
	"github.com/Mmx233/HeyFileGo/v2/internal/share"
	"github.com/gin-gonic/gin"
)

func Init(target *share.Target) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	E := gin.New()
	E.Use(recoverHTTPPanic)

	api.Init(E.Group("api"), target)

	E.Use(frontendHandler())

	return E
}

func recoverHTTPPanic(c *gin.Context) {
	defer func() {
		if recovered := recover(); recovered != nil {
			if err, ok := recovered.(error); ok && errors.Is(err, http.ErrAbortHandler) {
				panic(http.ErrAbortHandler)
			}
			slog.Error("HTTP handler panic", "panic", recovered, "stack", string(debug.Stack()))
			c.AbortWithStatus(http.StatusInternalServerError)
		}
	}()
	c.Next()
}
