//go:build !dev

package router

import (
	webServe "github.com/Mmx233/GinWebServe"
	"github.com/Mmx233/HeyFileGo/v2/web"
	"github.com/gin-gonic/gin"
	"log/slog"
	"os"
)

func frontendHandler() gin.HandlerFunc {
	fs, err := web.Fs()
	if err != nil {
		slog.Error("读取 embed fs 失败，请反馈开发者", "err", err)
		os.Exit(1)
	}

	handler, err := webServe.New(fs)
	if err != nil {
		slog.Error("创建 web handler 失败，请反馈开发者", "err", err)
		os.Exit(1)
	}

	return handler
}
