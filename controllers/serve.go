package controllers

import (
	"HeyFileGo/global"
	"fmt"
	"github.com/Mmx233/tool"
	"github.com/gin-gonic/gin"
	"log"
	"path"
	"strings"
)

func ServeFile(filePath string) {
	if !tool.File.Exists(filePath) {
		log.Fatalln(fmt.Sprintf("error: 文件 %s 不存在", filePath))
	}

	fileName := path.Base(strings.Replace(filePath, `\`, `/`, -1))

	global.G.GET("/", func(c *gin.Context) {
		c.Redirect(302, "/"+fileName)
	})

	global.G.GET("/"+fileName, func(c *gin.Context) {
		c.File(filePath)
	})
}

func ServeUpload() {

}
