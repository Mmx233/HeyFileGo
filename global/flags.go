package global

import (
	"github.com/jessevdk/go-flags"
	"os"
)

var Flags struct {
	Port uint16 `short:"p" long:"port"`
	Ssl  bool   `short:"s" long:"ssl" description:"use https"`
}

var Args []string

func init() {
	var e error
	Args, e = flags.ParseArgs(&Flags, os.Args)
	if e != nil {
		panic(e)
	}
}
