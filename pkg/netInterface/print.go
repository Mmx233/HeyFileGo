package netInterface

import (
	"fmt"
	qrcodeTerminal "github.com/Baozisoftware/qrcode-terminal-go"
	"github.com/fatih/color"
	"net/url"
	"strings"
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

func (p Printer) EthUrl(eth Eth) *url.URL {
	return eth.Url(p.scheme, p.port)
}

func (p Printer) EthSelect(list []Eth) []*url.URL {
	urlList := make([]*url.URL, len(list))
	for i, eth := range list {
		ethUrl := p.EthUrl(eth)
		urlList[i] = ethUrl
		fmt.Println(i, fmt.Sprintf("%s (%s)", eth.Name, ethUrl))
	}
	return urlList
}

func (p Printer) Qr(addr *url.URL) {
	qrcodeTerminal.New().Get(addr.String()).Print()
}

func (p Printer) Url(addr *url.URL) {
	fmt.Printf("%s %s\n",
		color.GreenString("URL:"),
		color.HiGreenString(addr.String()),
	)
}

func (p Printer) Wget(addr *url.URL, fileName string) {
	var args = []string{
		"wget", "-O", fmt.Sprintf("\"%s\"", fileName),
	}
	if addr.Scheme == "https" {
		args = append(args, "--no-check-certificate")
	}
	args = append(args, addr.String())
	fmt.Printf("%s %s\n",
		color.GreenString("CMD:"),
		color.HiGreenString(strings.Join(args, " ")),
	)
}
