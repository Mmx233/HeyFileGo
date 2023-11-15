package tools

import (
	"path"
	"strings"
)

func Filename(filePath string) string {
	return path.Base(strings.Replace(filePath, `\`, `/`, -1))
}
