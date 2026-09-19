package router_test

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/Mmx233/HeyFileGo/v2/internal/share"
)

func TestInfoReportsModeWithoutHostPath(t *testing.T) {
	rootPath := t.TempDir()
	filePath := filepath.Join(rootPath, "shared.txt")
	if err := os.WriteFile(filePath, []byte("content"), 0o600); err != nil {
		t.Fatal(err)
	}
	t.Chdir(rootPath)
	for _, test := range []struct {
		path string
		mode share.Mode
		name string
	}{
		{rootPath, share.ModeDir, filepath.Base(rootPath)},
		{".", share.ModeDir, filepath.Base(rootPath)},
		{filePath, share.ModeFile, "shared.txt"},
		{"", share.ModeUpload, ""},
	} {
		t.Run(string(test.mode)+test.name, func(t *testing.T) {
			target, err := share.OpenTarget(test.path)
			if err != nil {
				t.Fatal(err)
			}
			defer target.Close()
			response := performRequest(newEngine(target), "/api/info")
			var result struct {
				Data struct {
					Mode share.Mode `json:"mode"`
					Name string     `json:"name"`
				} `json:"data"`
			}
			if err := json.Unmarshal(response.Body.Bytes(), &result); err != nil {
				t.Fatal(err)
			}
			if response.Code != http.StatusOK || result.Data.Mode != test.mode || result.Data.Name != test.name {
				t.Fatalf("info response = %d %s", response.Code, response.Body.String())
			}
			if strings.Contains(result.Data.Name, rootPath) && rootPath != test.name {
				t.Fatal("info exposed the host path")
			}
		})
	}
}
