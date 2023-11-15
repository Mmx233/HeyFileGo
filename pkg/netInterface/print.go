package netInterface

import (
	"fmt"
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

func (p Printer) AddrStr(eth Eth) string {
	addr := url.URL{
		Scheme: p.scheme,
		Host:   eth.Ip + ":" + p.port,
	}
	return fmt.Sprintf("%s（%s）", eth.Name, addr.String())
}

func (p Printer) EthSelect(list []Eth) {
	for i, eth := range list {
		fmt.Println(i, p.AddrStr(eth))
	}
}
