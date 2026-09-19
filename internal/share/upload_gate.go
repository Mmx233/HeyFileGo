package share

import (
	"context"
	"fmt"
)

// SetUploadConcurrency configures the shared limit before the target is served.
func (t *Target) SetUploadConcurrency(limit int) error {
	if t.mode != ModeUpload {
		return ErrWrongMode
	}
	if limit < 1 {
		return fmt.Errorf("upload concurrency must be at least 1")
	}
	t.uploadGate = make(chan struct{}, limit)
	return nil
}

func (t *Target) UploadConcurrency() int { return cap(t.uploadGate) }

// AcquireUpload shares upload slots across every client of this target.
func (t *Target) AcquireUpload(ctx context.Context) (func(), error) {
	if t.mode != ModeUpload || t.uploadGate == nil {
		return nil, ErrWrongMode
	}
	if err := ctx.Err(); err != nil {
		return nil, err
	}
	select {
	case t.uploadGate <- struct{}{}:
		if err := ctx.Err(); err != nil {
			<-t.uploadGate
			return nil, err
		}
		return func() { <-t.uploadGate }, nil
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}
