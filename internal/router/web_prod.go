//go:build !dev

package router

import (
	webServe "github.com/Mmx233/GinWebServe"
	"github.com/Mmx233/HeyFileGo/v2/web"
	"github.com/gin-gonic/gin"
	"log"
)

func frontendHandler() gin.HandlerFunc {
	fs, err := web.Fs()
	if err != nil {
		log.Fatalln(err)
	}

	handler, err := webServe.New(fs)
	if err != nil {
		log.Fatalln(err)
	}

	return handler
}
