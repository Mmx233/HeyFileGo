package controllers

import (
	"github.com/Mmx233/HeyFileGo/v2/internal/api/callback"
	"github.com/gin-gonic/gin"
	"log"
	"strings"
)

func Upload(c *gin.Context) {
	f, err := c.FormFile("file")
	if err != nil {
		callback.ErrorWithTip(c, callback.ErrForm, "读取表单文件失败", err)
		return
	}

	if f.Filename == "" ||
		strings.Contains(f.Filename, "/") || strings.Contains(f.Filename, "\\") {
		callback.ErrorWithTip(c, callback.ErrForm, "文件名称不合法", err)
		return
	}

	if err = c.SaveUploadedFile(f, f.Filename); err != nil {
		callback.Error(c, callback.ErrFileOperation, err)
		return
	}

	log.Println("info: 文件 " + f.Filename + " 已保存")
	callback.Default(c)
}
