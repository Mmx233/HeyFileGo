package main

import (
	"crypto/tls"
	"fmt"
	"github.com/Mmx233/HeyFileGo/v2/internal/config"
	"github.com/Mmx233/HeyFileGo/v2/internal/router"
	"github.com/Mmx233/HeyFileGo/v2/pkg/cert"
	"github.com/Mmx233/HeyFileGo/v2/pkg/netInterface"
	"log"
	"net"
	"net/http"
)

func apiServer(listener net.Listener) {
	var err error
	engine := router.Init()
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
}

func main() {
	listener, err := net.Listen("tcp", ":"+fmt.Sprint(config.Commands.Port))
	if err != nil {
		log.Fatalln("error: 监听失败：", err)
	}

	go apiServer(listener)

	ethList, err := netInterface.Load()
	if err != nil {
		log.Println("获取网卡信息失败:", err)
	} else {
		printer := netInterface.NewPrinter(config.Commands.Ssl, fmt.Sprint(listener.Addr().(*net.TCPAddr).Port))
		switch len(ethList) {
		case 0:
			fmt.Println("没有找到可用网卡！")
		case 1:
			ethUrl := printer.EthUrl(ethList[0])
			printer.Url(ethUrl)
			printer.Qr(ethUrl)
		default:
			ethUrlList := printer.EthSelect(ethList)
			for {
				fmt.Printf("选择网卡（序号）：\n")
				var n int
				_, err := fmt.Scanln(&n)
				if err != nil {
					log.Println("读取输入异常：", err)
					continue
				}
				if len(ethList) <= n || n < 0 {
					log.Println("warning: 序号不正确：", err)
					continue
				}
				ethUrl := ethUrlList[n]
				printer.Url(ethUrl)
				printer.Qr(ethUrl)
			}
		}
	}
	select {}
}
