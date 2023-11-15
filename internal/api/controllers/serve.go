package controllers

import (
	"github.com/Mmx233/HeyFileGo/v2/frontend"
	"github.com/Mmx233/HeyFileGo/v2/internal/global"
	"github.com/Mmx233/tool"
	"github.com/gin-gonic/gin"
	"github.com/qingstor/go-mime"
	"html/template"
	"io/fs"
	"log"
	"net/http"
	"path"
	"strings"
)

func ServeFile(filePath string) {
	if exist, err := tool.File.Exists(filePath); err != nil {
		log.Fatalln("读取文件失败:", err)
	} else if !exist {
		log.Fatalf("error: 文件 %s 不存在", filePath)
	}

	mimeType := mime.DetectFilePath(filePath)

	fileName := path.Base(strings.Replace(filePath, `\`, `/`, -1))

	global.G.GET("/", func(c *gin.Context) {
		c.Redirect(302, "/"+fileName)
	})

	global.G.GET("/"+fileName, func(c *gin.Context) {
		c.Header("Content-Type", mimeType)
		c.File(filePath)
	})
}

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
