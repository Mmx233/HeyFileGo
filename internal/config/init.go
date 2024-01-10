package config

func Init(Version string) {
	initCommands(Version)
	initServer()
}
