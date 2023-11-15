//go:build !dev

package router

import (
	webServe "github.com/Mmx233/GinWebServe"
	"github.com/Mmx233/HeyFileGo/v2/web"
	"github.com/gin-gonic/gin"
	"log"
)

func frontendHandler(mode string) gin.HandlerFunc {
	fs, err := web.Fs()
	if err != nil {
		log.Fatalln(err)
	}

	handler, err := webServe.NewWithInterceptor(fs, func(c *gin.Context) {
		c.Request.URL.Fragment = mode
	})
	if err != nil {
		log.Fatalln(err)
	}

	return handler
}
