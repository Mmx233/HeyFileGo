package netInterface

import (
	"net"
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
