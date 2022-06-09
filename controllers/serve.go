package controllers

import (
	"HeyFileGo/frontend"
	"HeyFileGo/global"
	"fmt"
	"github.com/Mmx233/tool"
	"github.com/gin-gonic/gin"
	"html/template"
	"io/fs"
	"log"
	"net/http"
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
	t, e := template.ParseFS(frontend.FS, "*.html")
	if e != nil {
		log.Fatalln(e)
	}
	global.G.SetHTMLTemplate(t)

	static, e := fs.Sub(frontend.Static, "static")
	if e != nil {
		log.Fatalln(e)
	}
	global.G.StaticFS("/static", http.FS(static))
	global.G.GET("/", func(c *gin.Context) {
		c.HTML(200, "upload.html", nil)
	})
	global.G.POST("/upload", func(c *gin.Context) {
		f, e := c.FormFile("file")
		if e != nil {
			c.AbortWithStatus(400)
			return
		}

		if e = c.SaveUploadedFile(f, f.Filename); e != nil {
			log.Println("warning: 文件传输失败：", e)
			c.AbortWithStatus(500)
			return
		}

		log.Println("info: 文件 " + f.Filename + " 已保存")
	})
}
