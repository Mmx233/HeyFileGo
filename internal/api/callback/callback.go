package callback

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"log/slog"
)

type Msg struct {
	Code       uint8       `json:"code"`
	Data       interface{} `json:"data,omitempty"`
	Msg        string      `json:"msg,omitempty"`
	HttpStatus int         `json:"-"`
}

func Error(c *gin.Context, msg Msg, args ...any) {
	for _, arg := range args {
		msg.Msg += ": " + fmt.Sprint(arg)
	}
	slog.Error(msg.Msg)
	c.JSON(msg.HttpStatus, msg)
	c.Abort()
}

func ErrorWithTip(c *gin.Context, msg Msg, tip any, args ...any) {
	msg.Msg = fmt.Sprint(tip)
	Error(c, msg, args...)
}

func Success(c *gin.Context, data interface{}) {
	c.JSON(200, &Msg{
		Data: data,
	})
	c.Abort()
}

func Default(c *gin.Context) {
	Success(c, nil)
}
