package netInterface

import (
	"fmt"
	qrcodeTerminal "github.com/Baozisoftware/qrcode-terminal-go"
	"net/url"
)

func NewPrinter(ssl bool, port string) Printer {
	var scheme string
	if ssl {
		scheme = "https"
	} else {
		scheme = "http"
	}
	return Printer{
		scheme: scheme,
		port:   port,
	}
}

type Printer struct {
	scheme string
	port   string
}

func (p Printer) EthSelect(list []Eth) []*url.URL {
	urlList := make([]*url.URL, len(list))
	for i, eth := range list {
		ethUrl := eth.Url(p.scheme, p.port)
		urlList[i] = ethUrl
		fmt.Println(i, fmt.Sprintf("%s（%s）", eth.Name, ethUrl))
	}
	return urlList
}

func (p Printer) Qr(ethUrl *url.URL) {
	qrcodeTerminal.New().Get(ethUrl).Print()
}
