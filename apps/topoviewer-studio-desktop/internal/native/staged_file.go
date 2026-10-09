package native

import (
	"errors"
	"io"
	"io/fs"
)

type stagedFile interface {
	Chmod(fs.FileMode) error
	Write([]byte) (int, error)
	Sync() error
	Close() error
}

// WriteAndCloseStagedFile closes the file on every path and only succeeds after
// the entire content has been written and synced. The caller owns installation
// or removal of the temporary file.
func WriteAndCloseStagedFile(file stagedFile, mode fs.FileMode, content []byte) error {
	err := file.Chmod(mode)
	if err == nil {
		var written int
		written, err = file.Write(content)
		if err == nil && written != len(content) {
			err = io.ErrShortWrite
		}
	}
	if err == nil {
		err = file.Sync()
	}
	return errors.Join(err, file.Close())
}
