import { useCallback } from "react";
import { useFileBrowser } from "@/context/useFileBrowser";

/**
 * Selection state returned by the hook
 */
export interface SelectionState {
  selectedItems: Set<string>;
  lastSelectedItem: string | null;
  focusedItem: string | null;
  selectedCount: number;
  hasSelection: boolean;
}

/**
 * Selection actions returned by the hook
 */
export interface SelectionActions {
  /** Handle item click with modifier keys */
  handleItemClick: (name: string, ctrlKey: boolean, shiftKey: boolean) => void;
  /** Select all items */
  selectAll: () => void;
  /** Clear all selections */
  clearSelection: () => void;
  /** Check if an item is selected */
  isSelected: (name: string) => boolean;
  /** Toggle selection of a single item (equivalent to Ctrl+click) */
  toggleSelection: (name: string) => void;
  /** Select a single item (clears other selections) */
  selectItem: (name: string) => void;
  /** Select a range from last selected to target (equivalent to Shift+click) */
  selectRange: (name: string) => void;
}

/**
 * Hook for managing file/folder selection in the file browser.
 * 
 * Implements:
 * - Single selection (normal click)
 * - Multi-selection with Ctrl/Cmd+click (toggle)
 * - Range selection with Shift+click
 * - Select all
 * - Clear selection
 * 
 * Requirements: 5.1, 5.2, 5.4, 9.4, 9.5
 */
export function useSelection(): SelectionState & SelectionActions {
  const { state, dispatch } = useFileBrowser();

  const { selectedItems, lastSelectedItem, focusedItem } = state;

  // Handle item click with modifier keys
  const handleItemClick = useCallback(
    (name: string, ctrlKey: boolean, shiftKey: boolean) => {
      dispatch({
        type: "SELECT_ITEM",
        payload: { name, ctrlKey, shiftKey },
      });
    },
    [dispatch],
  );

  // Select all items
  const selectAll = useCallback(() => {
    dispatch({ type: "SELECT_ALL" });
  }, [dispatch]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    dispatch({ type: "CLEAR_SELECTION" });
  }, [dispatch]);

  // Check if an item is selected
  const isSelected = useCallback(
    (name: string) => selectedItems.has(name),
    [selectedItems],
  );

  // Toggle selection of a single item (Ctrl+click behavior)
  const toggleSelection = useCallback(
    (name: string) => {
      dispatch({
        type: "SELECT_ITEM",
        payload: { name, ctrlKey: true, shiftKey: false },
      });
    },
    [dispatch],
  );

  // Select a single item (clears other selections)
  const selectItem = useCallback(
    (name: string) => {
      dispatch({
        type: "SELECT_ITEM",
        payload: { name, ctrlKey: false, shiftKey: false },
      });
    },
    [dispatch],
  );

  // Select a range from last selected to target (Shift+click behavior)
  const selectRange = useCallback(
    (name: string) => {
      dispatch({
        type: "SELECT_ITEM",
        payload: { name, ctrlKey: false, shiftKey: true },
      });
    },
    [dispatch],
  );

  return {
    // State
    selectedItems,
    lastSelectedItem,
    focusedItem,
    selectedCount: selectedItems.size,
    hasSelection: selectedItems.size > 0,
    // Actions
    handleItemClick,
    selectAll,
    clearSelection,
    isSelected,
    toggleSelection,
    selectItem,
    selectRange,
  };
}

export default useSelection;
