package callback

const (
	cErrForm uint8 = iota + 1
	cErrMode
	cErrFileOperation
	cErrNotDir
	cErrFileNotFound
	cErrNotFile
)

var (
	ErrForm = Msg{
		Code:       cErrForm,
		Msg:        "参数错误，请反馈开发者",
		HttpStatus: 400,
	}
	ErrMode = Msg{
		Code:       cErrMode,
		Msg:        "运行模式异常，请反馈开发者",
		HttpStatus: 403,
	}
	ErrFileOperation = Msg{
		Code:       cErrFileOperation,
		Msg:        "文件操作失败",
		HttpStatus: 500,
	}
	ErrNotDir = Msg{
		Code:       cErrNotDir,
		Msg:        "目标路径不是文件夹",
		HttpStatus: 403,
	}
	ErrFileNotFound = Msg{
		Code:       cErrFileNotFound,
		Msg:        "文件不存在",
		HttpStatus: 404,
	}
	ErrNotFile = Msg{
		Code:       cErrNotFile,
		Msg:        "目标路径是文件夹",
		HttpStatus: 403,
	}
)
