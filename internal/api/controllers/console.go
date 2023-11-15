package controllers

import (
	"fmt"
	qrcodeTerminal "github.com/Baozisoftware/qrcode-terminal-go"
	"log"
	"net"
)

/*
func genUrl(ip, port string) string {
	var portal = "http"
	if global.Commands.Ssl {
		portal += "s"
	}
	if (port == "80" && !global.Commands.Ssl) || (port == "443" && global.Commands.Ssl) {
		return portal + "://" + ip
	}
	return portal + "://" + ip + ":" + port
}*/

func SelectEthToQr(port string) {
	eth, e := net.Interfaces()
	if e != nil {
		log.Println("warning: 获取 ip 地址失败：", e)
	}

	var ethSelect []string
	var ipSelect []string

	for _, s := range eth {
		if s.Flags&net.FlagUp != 0 {
			addr, err := s.Addrs()
			if err != nil {
				continue
			}
			for _, ip := range addr {
				if ipnet, ok := ip.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
					if ipnet.IP.To4() != nil {
						ethSelect = append(ethSelect, s.Name)
						ipSelect = append(ipSelect, ipnet.IP.String())
						break
					}
				}
			}
		}
	}

	switch len(ethSelect) {
	case 0:
		fmt.Println("未找到可用网卡！")
	case 1:
		url := genUrl(ipSelect[0], port)
		fmt.Println("URL: ", url)
		qrcodeTerminal.New().Get(url).Print()
	default:
		for i := range ethSelect {
			fmt.Println(i, ethSelect[i])
		}

		for {
			fmt.Printf("选择网卡（序号）：\n")
			var n int
			_, e = fmt.Scanln(&n)
			if e != nil {
				log.Println("warning: 读取输入异常：", e)
				continue
			}
			if len(ipSelect) <= n || n < 0 {
				log.Println("warning: 序号不正确：", e)
				continue
			}

			url := genUrl(ipSelect[n], port)
			fmt.Println("URL: ", url)
			qrcodeTerminal.New().Get(url).Print()
		}
	}
}
