//go:build linux

package native

import (
	"bytes"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"testing"
)

func TestStagedWritesPreservePreviousFilesOnDiskLimit(t *testing.T) {
	const childEnvironment = "TOPOVIEWER_TEST_FILE_SIZE_LIMIT"
	if os.Getenv(childEnvironment) != "1" {
		// The kernel limit is process-wide; isolate the fault from other tests.
		command := exec.Command(os.Args[0], "-test.run=^TestStagedWritesPreservePreviousFilesOnDiskLimit$")
		command.Env = append(os.Environ(), childEnvironment+"=1")
		if output, err := command.CombinedOutput(); err != nil {
			t.Fatalf("disk-limit subprocess failed: %v\n%s", err, output)
		}
		return
	}

	root := validProject(t)
	service := testService(t, nil)
	reference, err := service.ApproveRoot(root)
	if err != nil {
		t.Fatal(err)
	}
	original, err := os.ReadFile(filepath.Join(root, "topology.yaml"))
	if err != nil {
		t.Fatal(err)
	}
	recovery := []byte(`{"previous":"recovery"}`)
	if err := service.WriteRecovery(reference.Token, recovery); err != nil {
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
	oversized := bytes.Repeat([]byte("x"), 4096)
	if _, err := service.CommitFiles(CommitRequest{
		ExpectedRevision: reference.Revision,
		Files:            []CommitWrite{{Bytes: oversized, Path: "topology.yaml"}},
		Token:            reference.Token,
	}); err == nil {
		t.Fatal("CommitFiles reported success after a kernel-enforced partial write")
	}
	actual, err := os.ReadFile(filepath.Join(root, "topology.yaml"))
	if err != nil || !bytes.Equal(actual, original) {
		t.Fatalf("failed save changed previous contents: %q, %v", actual, err)
	}
	if err := service.WriteRecovery(reference.Token, oversized); err == nil {
		t.Fatal("WriteRecovery reported success after a kernel-enforced partial write")
	}
	actualRecovery, err := service.ReadRecovery(reference.Token)
	if err != nil || !bytes.Equal(actualRecovery, recovery) {
		t.Fatalf("failed recovery save changed previous contents: %q, %v", actualRecovery, err)
	}
	matches, err := filepath.Glob(filepath.Join(root, ".topoviewer-*"))
	if err != nil || len(matches) != 0 {
		t.Fatalf("transaction files remain after failed save: %v, %v", matches, err)
	}
}
