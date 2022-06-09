package main

import (
	"HeyFileGo/controllers"
	"HeyFileGo/global"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
)

func main() {
	listener, e := net.Listen("tcp", ":0")
	if e != nil {
		log.Fatalln("error: 监听失败：", e)
	}

	if len(os.Args) < 2 {
		log.Fatalln("error: 请传入文件")
	} else {
		controllers.ServeFile(os.Args[1])
	}

	go func() {
		if e := http.Serve(listener, global.G); e != nil {
			log.Fatalln("error: 启动 http 服务失败：", e)
		}
	}()

	controllers.SelectEthToQr(fmt.Sprint(listener.Addr().(*net.TCPAddr).Port))
}
