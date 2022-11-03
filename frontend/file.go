package frontend

import "embed"

var (
	//go:embed source/upload/build/index.html
	UploadHTML embed.FS

	//go:embed source/upload/build/static/*
	UploadStatic embed.FS
)
