//go:build linux

package main

import (
	"bytes"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"testing"
)

func TestWriteExportPreservesOriginalOnPartialWrite(t *testing.T) {
	const childEnvironment = "TOPOVIEWER_TEST_EXPORT_SIZE_LIMIT"
	if os.Getenv(childEnvironment) != "1" {
		command := exec.Command(os.Args[0], "-test.run=^TestWriteExportPreservesOriginalOnPartialWrite$")
		command.Env = append(os.Environ(), childEnvironment+"=1")
		if output, err := command.CombinedOutput(); err != nil {
			t.Fatalf("disk-limit subprocess failed: %v\n%s", err, output)
		}
		return
	}
	root := t.TempDir()
	target := filepath.Join(root, "export.zip")
	original := []byte("previous successful export")
	if err := os.WriteFile(target, original, 0o600); err != nil {
		t.Fatal(err)
	}
	var priorLimit syscall.Rlimit
	if err := syscall.Getrlimit(syscall.RLIMIT_FSIZE, &priorLimit); err != nil {
		t.Fatal(err)
	}
	limit := priorLimit
	limit.Cur = 1024
	if err := syscall.Setrlimit(syscall.RLIMIT_FSIZE, &limit); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if err := syscall.Setrlimit(syscall.RLIMIT_FSIZE, &priorLimit); err != nil {
			t.Error(err)
		}
	})
	if err := writeExport(target, bytes.Repeat([]byte("x"), 4096)); err == nil {
		t.Fatal("export reported success after a kernel-enforced partial write")
	}
	actual, err := os.ReadFile(target)
	if err != nil || !bytes.Equal(actual, original) {
		t.Fatalf("failed export changed previous contents: %q, %v", actual, err)
	}
	matches, err := filepath.Glob(filepath.Join(root, ".topoviewer-export-*"))
	if err != nil || len(matches) != 0 {
		t.Fatalf("temporary export files remain: %v, %v", matches, err)
	}
}
