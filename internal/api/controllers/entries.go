package controllers

import (
	"cmp"
	"net/url"
	"slices"
	"strconv"
	"strings"

	"github.com/Mmx233/HeyFileGo/v2/internal/api/callback"
	"github.com/Mmx233/HeyFileGo/v2/internal/api/middlewares"
	"github.com/gin-gonic/gin"
)

type DirectoryPage struct {
	Items    []File `json:"items"`
	Total    int    `json:"total"`
	Page     int    `json:"page"`
	PageSize int    `json:"page_size"`
}

func (h *Controller) DirEntries(c *gin.Context) {
	h.directoryPage(c, false)
}

func (h *Controller) DirSearch(c *gin.Context) {
	h.directoryPage(c, true)
}

func (h *Controller) directoryPage(c *gin.Context, search bool) {
	query, err := url.ParseQuery(c.Request.URL.RawQuery)
	if err != nil {
		callback.Error(c, callback.ErrForm)
		return
	}
	allowedKeys := []string{"path", "page", "page_size", "sort", "order"}
	if search {
		allowedKeys = append(allowedKeys, "q")
	}
	for key, values := range query {
		if len(values) != 1 || !slices.Contains(allowedKeys, key) {
			callback.Error(c, callback.ErrForm)
			return
		}
	}
	if search && query.Get("q") == "" {
		callback.Error(c, callback.ErrForm)
		return
	}
	page, pageOK := positiveQueryInt(query, "page", 1)
	pageSize, sizeOK := positiveQueryInt(query, "page_size", 100)
	sortBy, order := query.Get("sort"), query.Get("order")
	if sortBy == "" {
		sortBy = "name"
	}
	if order == "" {
		order = "asc"
	}
	if !pageOK || !sizeOK || !slices.Contains([]int{50, 100, 200}, pageSize) ||
		!slices.Contains([]string{"name", "size", "modified"}, sortBy) ||
		!slices.Contains([]string{"asc", "desc"}, order) {
		callback.Error(c, callback.ErrForm)
		return
	}
	relativePath, ok := middlewares.QueryPath(c)
	if !ok {
		callback.Error(c, callback.ErrInvalidPath)
		return
	}
	items, err := h.directoryEntries(c.Request.Context(), relativePath)
	if err != nil {
		targetError(c, err)
		return
	}
	if search {
		term := strings.ToLower(query.Get("q"))
		items = slices.DeleteFunc(items, func(item File) bool {
			return !strings.Contains(strings.ToLower(item.Name), term)
		})
	}
	// Accurate counts and global sorting require scanning this directory.
	// Pagination bounds the response and browser work, not the metadata scan.
	slices.SortFunc(items, func(a, b File) int {
		if a.IsDir != b.IsDir {
			if a.IsDir {
				return -1
			}
			return 1
		}
		comparison := 0
		switch sortBy {
		case "size":
			comparison = cmp.Compare(a.Size, b.Size)
		case "modified":
			comparison = a.ModifiedAt.Compare(b.ModifiedAt)
		}
		if comparison == 0 {
			comparison = naturalNameCompare(a.Name, b.Name)
		}
		if order == "desc" {
			return -comparison
		}
		return comparison
	})
	total := len(items)
	lastPage := max(1, (total+pageSize-1)/pageSize)
	page = min(page, lastPage)
	start := (page - 1) * pageSize
	callback.Success(c, DirectoryPage{
		Items: items[start:min(start+pageSize, total)], Total: total,
		Page: page, PageSize: pageSize,
	})
}

func positiveQueryInt(query url.Values, key string, fallback int) (int, bool) {
	if !query.Has(key) {
		return fallback, true
	}
	value := query.Get(key)
	for _, char := range value {
		if char < '0' || char > '9' {
			return 0, false
		}
	}
	number, err := strconv.Atoi(value)
	return number, err == nil && number > 0
}

// Compare digit runs without integer conversion so arbitrarily long numbers
// sort naturally. The original name breaks case/zero-padding ties consistently.
func naturalNameCompare(a, b string) int {
	x, y := strings.ToLower(a), strings.ToLower(b)
	for len(x) > 0 && len(y) > 0 {
		if x[0] >= '0' && x[0] <= '9' && y[0] >= '0' && y[0] <= '9' {
			i, j := 0, 0
			for i < len(x) && x[i] >= '0' && x[i] <= '9' {
				i++
			}
			for j < len(y) && y[j] >= '0' && y[j] <= '9' {
				j++
			}
			xn, yn := strings.TrimLeft(x[:i], "0"), strings.TrimLeft(y[:j], "0")
			if comparison := cmp.Compare(len(xn), len(yn)); comparison != 0 {
				return comparison
			}
			if comparison := strings.Compare(xn, yn); comparison != 0 {
				return comparison
			}
			x, y = x[i:], y[j:]
			continue
		}
		if comparison := cmp.Compare(x[0], y[0]); comparison != 0 {
			return comparison
		}
		x, y = x[1:], y[1:]
	}
	if comparison := cmp.Compare(len(x), len(y)); comparison != 0 {
		return comparison
	}
	return strings.Compare(a, b)
}
