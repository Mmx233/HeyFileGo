package config

import (
	"github.com/alecthomas/kingpin/v2"
	"os"
)

var Commands struct {
	App   *kingpin.Application
	Ssl   bool
	Port  uint
	Files []string
}

func initCommands() {
	Commands.App = kingpin.New("HeyFileGo", "A lightweight file transfer tool.")
	Commands.App.HelpFlag.Short('h')
	Commands.App.Flag("ssl", "Enable tls for transfer.").Short('s').BoolVar(&Commands.Ssl)
	Commands.App.Flag("port", "Specify port.").Short('p').UintVar(&Commands.Port)
	Commands.App.Arg("file", "The file you want to transfer.").StringsVar(&Commands.Files)

	kingpin.MustParse(Commands.App.Parse(os.Args[1:]))
}
