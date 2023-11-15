package models

import "github.com/alecthomas/kingpin/v2"

type Commands struct {
	App   *kingpin.Application
	Ssl   bool
	Port  uint
	Files []string
}
