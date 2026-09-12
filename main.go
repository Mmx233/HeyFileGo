package main

import (
	"os"

	"github.com/Mmx233/HeyFileGo/v2/cmd"
)

var Version = "unknown"

func main() {
	if err := cmd.Execute(Version); err != nil {
		os.Exit(1)
	}
}
