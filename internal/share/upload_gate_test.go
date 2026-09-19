package share

import (
	"context"
	"errors"
	"testing"
)

func TestUploadGateLimitAndCancellation(t *testing.T) {
	target := &Target{mode: ModeUpload}
	if err := target.SetUploadConcurrency(2); err != nil {
		t.Fatal(err)
	}
	first, err := target.AcquireUpload(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	second, err := target.AcquireUpload(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	finished := make(chan error, 1)
	go func() {
		release, err := target.AcquireUpload(ctx)
		if release != nil {
			release()
		}
		finished <- err
	}()
	cancel()
	if err := <-finished; !errors.Is(err, context.Canceled) {
		t.Fatalf("queued upload = %v, want cancellation", err)
	}
	if len(target.uploadGate) != 2 {
		t.Fatalf("cancelled waiter changed active count: %d", len(target.uploadGate))
	}
	first()
	third, err := target.AcquireUpload(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	third()
	second()
	if len(target.uploadGate) != 0 {
		t.Fatal("upload slot leaked")
	}
	if release, err := target.AcquireUpload(ctx); release != nil || !errors.Is(err, context.Canceled) {
		t.Fatal("already cancelled request acquired a slot")
	}
}

func TestUploadConcurrencyValidation(t *testing.T) {
	target := &Target{mode: ModeUpload}
	for _, limit := range []int{0, -1} {
		if err := target.SetUploadConcurrency(limit); err == nil {
			t.Fatalf("accepted limit %d", limit)
		}
	}
	if err := target.SetUploadConcurrency(5); err != nil {
		t.Fatal(err)
	}
	if target.UploadConcurrency() != 5 {
		t.Fatal("configured limit not exposed")
	}
	other := &Target{mode: ModeDir}
	if err := other.SetUploadConcurrency(3); !errors.Is(err, ErrWrongMode) {
		t.Fatal(err)
	}
	if _, err := other.AcquireUpload(context.Background()); !errors.Is(err, ErrWrongMode) {
		t.Fatal(err)
	}
}
