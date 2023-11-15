package main

import (
	"crypto/tls"
	"fmt"
	"github.com/Mmx233/HeyFileGo/v2/internal/api/controllers"
	global2 "github.com/Mmx233/HeyFileGo/v2/internal/global"
	tls2 "github.com/Mmx233/HeyFileGo/v2/pkg/tls"
	"log"
	"net"
	"net/http"
	"os"
)

func main() {
	global2.ParseFlags(os.Args[1:])

	if len(global2.Commands.Files) == 0 {
		log.Println("info: 文件传入模式")
		controllers.ServeUpload()
	} else {
		log.Println("info: 文件上载模式")
		controllers.ServeFile(os.Args[1])
	}

	listener, e := net.Listen("tcp", ":"+fmt.Sprint(global2.Commands.Port))
	if e != nil {
		log.Fatalln("error: 监听失败：", e)
	}

	go func() {
		var e error
		if global2.Commands.Ssl {
			var cert tls.Certificate
			cert, e = tls2.GenCert()
			if e != nil {
				panic(e)
			}
			srv := &http.Server{
				Handler: global2.G,
				TLSConfig: &tls.Config{
					Certificates: []tls.Certificate{cert},
				},
			}
			e = srv.ServeTLS(listener, "", "")
		} else {
			e = http.Serve(listener, global2.G)
		}
		if e != nil {
			log.Fatalln("error: 启动 http 服务失败：", e)
		}
	}()

	controllers.SelectEthToQr(fmt.Sprint(listener.Addr().(*net.TCPAddr).Port))
	select {}
}
