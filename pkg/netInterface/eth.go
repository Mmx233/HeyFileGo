package netInterface

import (
	"fmt"
	"net"
	"net/url"
)

type Eth struct {
	Name string
	Ip   string
}

func Load() ([]Eth, error) {
	interfaces, err := net.Interfaces()
	if err != nil {
		return nil, err
	}

	var list []Eth
	for _, s := range interfaces {
		if s.Flags&net.FlagUp != 0 {
			addr, err := s.Addrs()
			if err != nil {
				continue
			}
			for _, ip := range addr {
				if ipnet, ok := ip.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
					if ipnet.IP.To4() != nil {
						list = append(list, Eth{
							Name: s.Name,
							Ip:   ipnet.IP.String(),
						})
						break
					}
				}
			}
		}
	}
	return list, nil
}

func PrintEth(list []Eth, ssl bool, port string) {
	var scheme string
	if ssl {
		scheme = "https"
	} else {
		scheme = "http"
	}
	for i, eth := range list {
		addr := url.URL{
			Scheme: scheme,
			Host:   eth.Ip + ":" + port,
		}
		fmt.Println(i, fmt.Sprintf("%s（%s）", eth.Name, addr.String()))
	}
}
