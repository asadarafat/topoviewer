package native

import (
	"errors"
	"io"
	"io/fs"
	"reflect"
	"testing"
)

type faultingStagedFile struct {
	chmodErr, writeErr, syncErr, closeErr error
	shortWrite                            bool
	calls                                 []string
	mode                                  fs.FileMode
	content                               string
}

func (f *faultingStagedFile) Chmod(mode fs.FileMode) error {
	f.calls = append(f.calls, "chmod")
	f.mode = mode
	return f.chmodErr
}

func (f *faultingStagedFile) Write(content []byte) (int, error) {
	f.calls = append(f.calls, "write")
	f.content = string(content)
	if f.shortWrite || f.writeErr != nil {
		return len(content) / 2, f.writeErr
	}
	return len(content), nil
}

func (f *faultingStagedFile) Sync() error {
	f.calls = append(f.calls, "sync")
	return f.syncErr
}

func (f *faultingStagedFile) Close() error {
	f.calls = append(f.calls, "close")
	return f.closeErr
}

func TestWriteAndCloseStagedFilePropagatesEveryFailure(t *testing.T) {
	failure := errors.New("injected filesystem failure")
	closeFailure := errors.New("injected close failure")
	for _, test := range []struct {
		name  string
		file  faultingStagedFile
		want  error
		calls []string
	}{
		{"chmod", faultingStagedFile{chmodErr: failure}, failure, []string{"chmod", "close"}},
		{"partial write", faultingStagedFile{writeErr: failure}, failure, []string{"chmod", "write", "close"}},
		{"silent short write", faultingStagedFile{shortWrite: true}, io.ErrShortWrite, []string{"chmod", "write", "close"}},
		{"sync", faultingStagedFile{syncErr: failure}, failure, []string{"chmod", "write", "sync", "close"}},
		{"close", faultingStagedFile{closeErr: closeFailure}, closeFailure, []string{"chmod", "write", "sync", "close"}},
		{"write and close", faultingStagedFile{writeErr: failure, closeErr: closeFailure}, failure, []string{"chmod", "write", "close"}},
		{"success", faultingStagedFile{}, nil, []string{"chmod", "write", "sync", "close"}},
	} {
		t.Run(test.name, func(t *testing.T) {
			err := WriteAndCloseStagedFile(&test.file, 0o600, []byte("complete contents"))
			if !errors.Is(err, test.want) {
				t.Fatalf("error = %v, want %v", err, test.want)
			}
			if test.file.closeErr != nil && !errors.Is(err, test.file.closeErr) {
				t.Fatalf("close error lost: %v", err)
			}
			if !reflect.DeepEqual(test.file.calls, test.calls) {
				t.Fatalf("filesystem operations = %v, want %v", test.file.calls, test.calls)
			}
			if test.file.mode != 0o600 {
				t.Fatalf("mode = %v", test.file.mode)
			}
			if test.file.chmodErr == nil && test.file.content != "complete contents" {
				t.Fatalf("content = %q", test.file.content)
			}
		})
	}
}
