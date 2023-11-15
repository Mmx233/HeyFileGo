package main

import (
	"crypto/tls"
	"fmt"
	"github.com/Mmx233/HeyFileGo/v2/internal/api/controllers"
	"github.com/Mmx233/HeyFileGo/v2/internal/config"
	"github.com/Mmx233/HeyFileGo/v2/internal/router"
	"github.com/Mmx233/HeyFileGo/v2/pkg/cert"
	"log"
	"net"
	"net/http"
)

func main() {
	var mode string

	if len(config.Commands.Files) == 0 {
		log.Println("info: 文件传入模式")
		mode = "upload"
	} else {
		log.Println("info: 文件上载模式")
		// todo 区分文件夹和文件
		mode = "serve"
	}

	listener, e := net.Listen("tcp", ":"+fmt.Sprint(config.Commands.Port))
	if e != nil {
		log.Fatalln("error: 监听失败：", e)
	}

	go func() {
		var err error
		engine := router.Init(mode)
		if config.Commands.Ssl {
			var certificate tls.Certificate
			certificate, err = cert.Gen()
			if err != nil {
				panic(err)
			}
			srv := &http.Server{
				Handler: engine,
				TLSConfig: &tls.Config{
					Certificates: []tls.Certificate{certificate},
				},
			}
			err = srv.ServeTLS(listener, "", "")
		} else {
			err = http.Serve(listener, engine)
		}
		if err != nil {
			log.Fatalln("error: 启动 http 服务失败：", err)
		}
	}()

	controllers.SelectEthToQr(fmt.Sprint(listener.Addr().(*net.TCPAddr).Port))
	select {}
}
