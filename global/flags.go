package global

import (
	"flag"
	"log"
)

var Flags struct {
	Port uint
	Ssl  bool
}

func init() {
	flag.UintVar(&Flags.Port, "p", 0, "port")
	flag.BoolVar(&Flags.Ssl, "ssl", false, "use https")
	flag.Parse()

	if Flags.Port > 65535 {
		log.Fatalln("port cannot bigger than 65535")
	}
}
