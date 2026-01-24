import { useEffect, useCallback } from "react";
import { useFileBrowser } from "@/context/useFileBrowser";
import { getParentPath } from "@/utils/path";

/**
 * Options for the keyboard navigation hook
 */
export interface UseKeyboardNavigationOptions {
  /** Sorted items list to navigate through */
  sortedItems: Dir.Info[];
  /** Callback when Enter is pressed on a folder */
  onOpenFolder?: (item: Dir.Info) => void;
  /** Callback when Enter is pressed on a file */
  onDownloadFile?: (item: Dir.Info) => void;
  /** Whether keyboard navigation is enabled */
  enabled?: boolean;
}

/**
 * Hook for keyboard navigation in the file browser.
 *
 * Implements:
 * - Arrow keys: Move focus between items
 * - Enter: Open folder / Download file
 * - Escape: Clear selection
 * - Backspace: Navigate to parent folder
 * - Ctrl+A: Select all items
 *
 */
export function useKeyboardNavigation(
  options: UseKeyboardNavigationOptions
): void {
  const { sortedItems, onOpenFolder, onDownloadFile, enabled = true } = options;
  const { state, dispatch, navigateTo } = useFileBrowser();
  const { focusedItem, currentPath, viewMode } = state;

  /**
   * Get the index of the currently focused item
   */
  const getFocusedIndex = useCallback((): number => {
    if (!focusedItem) return -1;
    return sortedItems.findIndex((item) => item.name === focusedItem);
  }, [focusedItem, sortedItems]);

  /**
   * Move focus by a delta amount (positive = down/right, negative = up/left)
   * Also selects the focused item
   */
  const moveFocus = useCallback(
    (delta: number) => {
      if (sortedItems.length === 0) return;

      const currentIndex = getFocusedIndex();
      let newIndex: number;

      if (currentIndex === -1) {
        // No current focus, start from beginning or end
        newIndex = delta > 0 ? 0 : sortedItems.length - 1;
      } else {
        // Clamp to valid range
        newIndex = Math.max(0, Math.min(sortedItems.length - 1, currentIndex + delta));
      }

      const newFocusedItem = sortedItems[newIndex]?.name;
      if (newFocusedItem) {
        // Select the item as well (single selection, no modifier keys)
        dispatch({
          type: "SELECT_ITEM",
          payload: { name: newFocusedItem, ctrlKey: false, shiftKey: false, sortedItems },
        });
      }
    },
    [sortedItems, getFocusedIndex, dispatch]
  );

  /**
   * Calculate grid columns based on viewport (approximate)
   */
  const getGridColumns = useCallback((): number => {
    const viewportWidth = window.innerWidth;
    const cardWidth = 200;
    const padding = 48;
    return Math.max(1, Math.floor((viewportWidth - padding) / cardWidth));
  }, []);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle if focus is in an input element
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (event.key) {
        case "ArrowUp": {
          event.preventDefault();
          if (viewMode === "grid") {
            moveFocus(-getGridColumns());
          } else {
            moveFocus(-1);
          }
          break;
        }

        case "ArrowDown": {
          event.preventDefault();
          if (viewMode === "grid") {
            moveFocus(getGridColumns());
          } else {
            moveFocus(1);
          }
          break;
        }

        case "ArrowLeft": {
          event.preventDefault();
          if (viewMode === "grid") {
            moveFocus(-1);
          }
          break;
        }

        case "ArrowRight": {
          event.preventDefault();
          if (viewMode === "grid") {
            moveFocus(1);
          }
          break;
        }

        case "Enter": {
          event.preventDefault();
          if (focusedItem) {
            const item = sortedItems.find((i) => i.name === focusedItem);
            if (item) {
              if (item.is_dir) {
                onOpenFolder?.(item);
              } else {
                onDownloadFile?.(item);
              }
            }
          }
          break;
        }

        case "Escape": {
          event.preventDefault();
          dispatch({ type: "CLEAR_SELECTION" });
          break;
        }

        case "Backspace": {
          event.preventDefault();
          if (currentPath !== "/") {
            const parentPath = getParentPath(currentPath);
            navigateTo(parentPath);
          }
          break;
        }

        case "a":
        case "A": {
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            dispatch({ type: "SELECT_ALL" });
          }
          break;
        }

        default:
          break;
      }
    },
    [
      viewMode,
      moveFocus,
      getGridColumns,
      focusedItem,
      sortedItems,
      onOpenFolder,
      onDownloadFile,
      dispatch,
      currentPath,
      navigateTo,
    ]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

export default useKeyboardNavigation;
