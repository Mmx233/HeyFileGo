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
	if len(os.Args) < 2 {
		log.Println("info: 文件传入模式")
		controllers.ServeUpload()
	} else {
		log.Println("info: 文件上载模式")
		controllers.ServeFile(os.Args[1])
	}

	listener, e := net.Listen("tcp", ":0")
	if e != nil {
		log.Fatalln("error: 监听失败：", e)
	}

	go func() {
		if e := http.Serve(listener, global.G); e != nil {
			log.Fatalln("error: 启动 http 服务失败：", e)
		}
	}()

	controllers.SelectEthToQr(fmt.Sprint(listener.Addr().(*net.TCPAddr).Port))
}
