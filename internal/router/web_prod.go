//go:build dev

package router

import (
	gateway "github.com/Mmx233/Gateway/v2"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
)

func frontendHandler() gin.HandlerFunc {
	return gateway.Proxy(&gateway.ApiConf{
		Addr:      "localhost:5173",
		Transport: http.DefaultTransport,
		ErrorHandler: func(_ http.ResponseWriter, _ *http.Request, err error) {
			log.Printf("调试页面请求转发失败: %v", err)
		},
		AllowRequest: func(c *gin.Context) bool {
			return !c.Writer.Written() && c.FullPath() == ""
		},
	})
}
