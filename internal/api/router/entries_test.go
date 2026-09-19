package router_test

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"testing"
	"time"

	"github.com/Mmx233/HeyFileGo/v2/internal/api/controllers"
	"github.com/Mmx233/HeyFileGo/v2/internal/share"
)

func directoryPage(t *testing.T, engine http.Handler, query string) controllers.DirectoryPage {
	t.Helper()
	response := performRequest(engine, query)
	if response.Code != http.StatusOK {
		t.Fatalf("directory page = %d %s", response.Code, response.Body.String())
	}
	var result struct {
		Data controllers.DirectoryPage `json:"data"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &result); err != nil {
		t.Fatal(err)
	}
	return result.Data
}

func TestDirectoryPaginationAndSearch(t *testing.T) {
	rootPath := t.TempDir()
	if err := os.Mkdir(filepath.Join(rootPath, "nested"), 0o700); err != nil {
		t.Fatal(err)
	}
	for i := range 123 {
		name := fmt.Sprintf("file%d.txt", i)
		if i < 55 {
			name = fmt.Sprintf("Match%d.txt", i)
		}
		if err := os.WriteFile(filepath.Join(rootPath, name), []byte{}, 0o600); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.WriteFile(filepath.Join(rootPath, "nested", "MatchHidden.txt"), []byte{}, 0o600); err != nil {
		t.Fatal(err)
	}
	target, err := share.OpenTarget(rootPath)
	if err != nil {
		t.Fatal(err)
	}
	defer target.Close()
	engine := newEngine(target)
	first := directoryPage(t, engine, "/api/dir/entries?path=.")
	if first.Total != 124 || first.Page != 1 || first.PageSize != 100 || len(first.Items) != 100 || first.Items[0].Name != "nested" {
		t.Fatalf("default page = %#v", first)
	}
	second := directoryPage(t, engine, "/api/dir/entries?path=.&page=2")
	if len(second.Items) != 24 || second.Page != 2 {
		t.Fatalf("second page = %#v", second)
	}
	seen := map[string]bool{}
	for _, entry := range append(first.Items, second.Items...) {
		if seen[entry.Name] {
			t.Fatalf("duplicate entry across pages: %s", entry.Name)
		}
		seen[entry.Name] = true
		if entry.ModifiedAt.IsZero() {
			t.Fatalf("missing modification time: %s", entry.Name)
		}
	}
	clamped := directoryPage(t, engine, "/api/dir/entries?path=.&page=999999999&page_size=50")
	if clamped.Page != 3 || len(clamped.Items) != 24 {
		t.Fatalf("out of bounds page = %#v", clamped)
	}
	search := directoryPage(t, engine, "/api/dir/search?path=.&q=mAtCh&page=2&page_size=50")
	if search.Total != 55 || len(search.Items) != 5 || search.Items[0].Name != "Match50.txt" {
		t.Fatalf("search must filter current children before paginating: %#v", search)
	}
	empty := directoryPage(t, engine, "/api/dir/search?path=.&q=absent&page=2")
	if empty.Items == nil || len(empty.Items) != 0 || empty.Total != 0 || empty.Page != 1 {
		t.Fatalf("empty search = %#v", empty)
	}
	response := performRequest(engine, "/api/dir/search?path=.&q=Match0")
	var wire struct {
		Data struct {
			Items []map[string]json.RawMessage `json:"items"`
		} `json:"data"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &wire); err != nil {
		t.Fatal(err)
	}
	if len(wire.Data.Items) != 1 || string(wire.Data.Items[0]["size"]) != "0" {
		t.Fatalf("empty file size omitted from JSON: %s", response.Body.String())
	}
}

func TestDirectorySorting(t *testing.T) {
	rootPath := t.TempDir()
	for _, name := range []string{"folder10", "folder2"} {
		if err := os.Mkdir(filepath.Join(rootPath, name), 0o700); err != nil {
			t.Fatal(err)
		}
	}
	for i, name := range []string{"file10", "file2", "FILE2", "file02"} {
		filePath := filepath.Join(rootPath, name)
		if err := os.WriteFile(filePath, make([]byte, i+1), 0o600); err != nil {
			t.Fatal(err)
		}
		modified := time.Unix(1700000000+int64(i), 0)
		if err := os.Chtimes(filePath, modified, modified); err != nil {
			t.Fatal(err)
		}
	}
	target, err := share.OpenTarget(rootPath)
	if err != nil {
		t.Fatal(err)
	}
	defer target.Close()
	engine := newEngine(target)
	namePage := directoryPage(t, engine, "/api/dir/entries?path=.&sort=name")
	names := make([]string, 0, len(namePage.Items))
	for _, entry := range namePage.Items {
		names = append(names, entry.Name)
	}
	// Case-sensitive filesystems retain both FILE2 and file2; Windows may not.
	want := []string{"folder2", "folder10", "FILE2", "file02", "file2", "file10"}
	if len(names) == 5 {
		want = []string{"folder2", "folder10", "file02", "file2", "file10"}
	}
	if !slices.Equal(names, want) {
		t.Fatalf("natural order = %v, want %v", names, want)
	}
	for _, sortBy := range []string{"size", "modified"} {
		page := directoryPage(t, engine, "/api/dir/entries?path=.&sort="+sortBy+"&order=desc")
		if !page.Items[0].IsDir || !page.Items[1].IsDir || page.Items[2].Name != "file02" || page.Items[len(page.Items)-1].Name != "file10" {
			t.Fatalf("%s descending order = %#v", sortBy, page.Items)
		}
	}
}

func TestDirectoryPaginationRejectsInvalidQueries(t *testing.T) {
	target, err := share.OpenTarget(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	defer target.Close()
	engine := newEngine(target)
	for _, query := range []string{
		"path=.&page=0", "path=.&page=-1", "path=.&page=1.2", "path=.&page=", "path=.&page=99999999999999999999",
		"path=.&page_size=1", "path=.&page_size=201", "path=.&page=1&page=2", "path=.&path=nested",
		"path=.&sort=unknown", "path=.&order=unknown", "path=.&q=unsupported", "path=../outside", "path=%zz",
	} {
		response := performRequest(engine, "/api/dir/entries?"+query)
		if response.Code != http.StatusBadRequest {
			t.Errorf("query %q = %d %s", query, response.Code, response.Body.String())
		}
	}
	response := performRequest(engine, "/api/dir/search?path=.")
	if response.Code != http.StatusBadRequest {
		t.Fatalf("search without term = %d", response.Code)
	}
}
