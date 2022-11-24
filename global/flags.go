package global

import (
	"flag"
	"log"
)

var Flags struct {
	Port uint
}

func init() {
	flag.UintVar(&Flags.Port, "p", 0, "port")
	flag.Parse()

	if Flags.Port > 65535 {
		log.Fatalln("port cannot bigger than 65535")
	}
}
