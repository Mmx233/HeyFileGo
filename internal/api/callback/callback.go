package callback

import (
	"fmt"
	"log/slog"

	"github.com/gin-gonic/gin"
)

type Msg struct {
	Code       uint8       `json:"code"`
	Data       interface{} `json:"data,omitempty"`
	Msg        string      `json:"msg,omitempty"`
	HttpStatus int         `json:"-"`
}

func Error(c *gin.Context, msg Msg, args ...any) {
	if len(args) == 0 {
		slog.Error(msg.Msg)
	} else {
		slog.Error(msg.Msg, "detail", fmt.Sprint(args...))
	}
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
