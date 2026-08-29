package controllers

import (
	"errors"

	"github.com/Mmx233/HeyFileGo/v2/internal/api/callback"
	"github.com/Mmx233/HeyFileGo/v2/internal/share"
	"github.com/gin-gonic/gin"
)

type Controller struct {
	target *share.Target
}

func New(target *share.Target) *Controller {
	return &Controller{target: target}
}

func targetError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, share.ErrWrongMode):
		callback.Error(c, callback.ErrMode, err)
	case errors.Is(err, share.ErrNotDirectory):
		callback.Error(c, callback.ErrNotDir, err)
	case errors.Is(err, share.ErrNotRegular):
		callback.Error(c, callback.ErrNotFile, err)
	default:
		// Root lookup errors are intentionally collapsed to avoid exposing
		// whether an inaccessible or escaping target exists.
		callback.Error(c, callback.ErrFileNotFound, err)
	}
}
