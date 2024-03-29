package main

import (
	"crypto/tls"
	"fmt"
	"github.com/Mmx233/HeyFileGo/v2/internal/config"
	"github.com/Mmx233/HeyFileGo/v2/internal/router"
	"github.com/Mmx233/HeyFileGo/v2/pkg/cert"
	"github.com/Mmx233/HeyFileGo/v2/pkg/netInterface"
	"log/slog"
	"net"
	"net/http"
	"net/url"
	"os"
)

var Version = "unknown"

func init() {
	config.Init(Version)
}

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
		slog.Error("启动 http 服务失败", "err", err)
		os.Exit(1)
	}
}

func printEth(printer netInterface.Printer, ethUrl *url.URL) {
	printer.Url(ethUrl)
	if config.Mode == config.ModeFile {
		downloadUrl := *ethUrl
		downloadUrl.Path = "/api/file/"
		printer.Wget(&downloadUrl, config.FileInfo.Name())
	}
	printer.Qr(ethUrl)
}

func main() {
	listener, err := net.Listen("tcp", ":"+fmt.Sprint(config.Commands.Port))
	if err != nil {
		slog.Error("启动 http 监听失败", "err", err)
		os.Exit(1)
	}

	go apiServer(listener)

	ethList, err := netInterface.Load()
	if err != nil {
		slog.Info("获取网卡信息失败", "err", err)
	} else {
		printer := netInterface.NewPrinter().WithEth(config.Commands.Ssl, fmt.Sprint(listener.Addr().(*net.TCPAddr).Port))

		switch len(ethList) {
		case 0:
			slog.Warn("没有找到可用网卡！")
		case 1:
			printEth(printer.Printer, printer.EthUrl(ethList[0]))
		default:
			ethUrlList := printer.EthSelect(ethList)
			for {
				fmt.Printf("选择网卡二维码（序号）：\n")
				var n int
				_, err := fmt.Scanln(&n)
				if err != nil {
					slog.Error("读取输入异常", "err", err)
					continue
				}
				if len(ethList) <= n || n < 0 {
					slog.Error("序号不正确", "err", err)
					continue
				}
				printEth(printer.Printer, ethUrlList[n])
			}
		}
	}
	select {}
}
