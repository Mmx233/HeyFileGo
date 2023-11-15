package controllers

import (
	"github.com/gin-gonic/gin"
	"html/template"
	"io/fs"
	"log"
	"net/http"
)

func ServeUpload() {
	t, e := template.ParseFS(frontend.UploadHTML, "source/upload/build/index.html")
	if e != nil {
		log.Fatalln(e)
	}
	global.G.SetHTMLTemplate(t)

	static, e := fs.Sub(frontend.UploadStatic, "source/upload/build/static")
	if e != nil {
		log.Fatalln(e)
	}
	global.G.StaticFS("/static", http.FS(static))
	global.G.GET("/", func(c *gin.Context) {
		c.HTML(200, "index.html", nil)
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
