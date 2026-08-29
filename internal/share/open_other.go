//go:build !unix

package share

import "os"

func openReadOnly(name string) (*os.File, error) {
	return os.Open(name)
}

func openRootReadOnly(root *os.Root, name string) (*os.File, error) {
	return root.Open(name)
}
