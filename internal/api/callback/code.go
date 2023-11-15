package callback

const (
	cErrForm uint8 = iota + 1
	cErrMode
)

var (
	ErrForm = &Msg{
		Code:       cErrForm,
		Msg:        "参数错误，请反馈开发者",
		HttpStatus: 400,
	}
	ErrMode = &Msg{
		Code:       cErrMode,
		Msg:        "运行模式异常，请反馈开发者",
		HttpStatus: 403,
	}
)
