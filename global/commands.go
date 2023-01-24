package global

import (
	"HeyFileGo/global/models"
	"gopkg.in/alecthomas/kingpin.v2"
)

var Commands models.Commands

func init() {
	Commands.App = kingpin.New("HeyFileGo", "A lightweight file transfer tool.")
	Commands.App.HelpFlag.Short('h')
	Commands.App.Flag("ssl", "Enable tls for transfer.").Short('s').BoolVar(&Commands.Ssl)
	Commands.App.Flag("port", "Specify port.").Short('p').UintVar(&Commands.Port)
	Commands.App.Arg("file", "The file you want to transfer.").StringsVar(&Commands.Files)
}

func ParseFlags(args []string) string {
	return kingpin.MustParse(Commands.App.Parse(args))
}