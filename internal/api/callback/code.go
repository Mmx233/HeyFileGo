package callback

const (
	cErrForm uint8 = iota + 1
	cErrMode
	cErrFileOperation
	cErrNotDir
	cErrFileNotFound
	cErrNotFile
	cErrInvalidPath
	cErrFileExists
)

var (
	ErrForm = Msg{
		Code:       cErrForm,
		Msg:        "Invalid parameters, please report to the developer",
		HttpStatus: 400,
	}
	ErrMode = Msg{
		Code:       cErrMode,
		Msg:        "Invalid runtime mode, please report to the developer",
		HttpStatus: 403,
	}
	ErrFileOperation = Msg{
		Code:       cErrFileOperation,
		Msg:        "File operation failed",
		HttpStatus: 500,
	}
	ErrNotDir = Msg{
		Code:       cErrNotDir,
		Msg:        "Target path is not a directory",
		HttpStatus: 403,
	}
	ErrFileNotFound = Msg{
		Code:       cErrFileNotFound,
		Msg:        "File not found",
		HttpStatus: 404,
	}
	ErrNotFile = Msg{
		Code:       cErrNotFile,
		Msg:        "Target path is a directory",
		HttpStatus: 403,
	}
	ErrInvalidPath = Msg{
		Code:       cErrInvalidPath,
		Msg:        "Invalid path",
		HttpStatus: 400,
	}
	ErrFileExists = Msg{
		Code:       cErrFileExists,
		Msg:        "A file with this name already exists",
		HttpStatus: 409,
	}
)
