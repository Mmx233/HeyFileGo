package frontend

import "embed"

//go:embed *.html
var FS embed.FS

//go:embed static/*
var Static embed.FS
