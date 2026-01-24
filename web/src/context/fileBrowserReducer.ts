// State interface
export interface FileBrowserState {
  currentPath: string;
  items: Dir.Info[];
  selectedItems: Set<string>;
  viewMode: "grid" | "list";
  sortBy: "name" | "size";
  sortOrder: "asc" | "desc";
  isLoading: boolean;
  error: string | null;
  focusedItem: string | null;
  lastSelectedItem: string | null;
}

// Action types
export type FileBrowserAction =
  | { type: "SET_PATH"; payload: string }
  | { type: "SET_ITEMS"; payload: Dir.Info[] }
  | {
      type: "SELECT_ITEM";
      payload: { name: string; ctrlKey: boolean; shiftKey: boolean; sortedItems?: Dir.Info[] };
    }
  | { type: "SELECT_ALL" }
  | { type: "CLEAR_SELECTION" }
  | { type: "SET_SELECTION"; payload: Set<string> }
  | { type: "SET_VIEW_MODE"; payload: "grid" | "list" }
  | {
      type: "SET_SORT";
      payload: { sortBy: "name" | "size"; sortOrder: "asc" | "desc" };
    }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_FOCUSED_ITEM"; payload: string | null }
  | {
      type: "RESTORE_PREFERENCES";
      payload: {
        viewMode: "grid" | "list";
        sortBy: "name" | "size";
        sortOrder: "asc" | "desc";
      };
    };

// Initial state
export const initialState: FileBrowserState = {
  currentPath: "/",
  items: [],
  selectedItems: new Set<string>(),
  viewMode: "grid",
  sortBy: "name",
  sortOrder: "asc",
  isLoading: false,
  error: null,
  focusedItem: null,
  lastSelectedItem: null,
};

// Helper function to get range selection
function getRangeSelection(
  items: Dir.Info[],
  lastSelected: string | null,
  current: string,
): Set<string> {
  if (!lastSelected) {
    return new Set([current]);
  }

  const itemNames = items.map((item) => item.name);
  const lastIndex = itemNames.indexOf(lastSelected);
  const currentIndex = itemNames.indexOf(current);

  if (lastIndex === -1 || currentIndex === -1) {
    return new Set([current]);
  }

  const start = Math.min(lastIndex, currentIndex);
  const end = Math.max(lastIndex, currentIndex);

  return new Set(itemNames.slice(start, end + 1));
}

// Reducer function
export function fileBrowserReducer(
  state: FileBrowserState,
  action: FileBrowserAction,
): FileBrowserState {
  switch (action.type) {
    case "SET_PATH":
      return {
        ...state,
        currentPath: action.payload,
        selectedItems: new Set<string>(),
        focusedItem: null,
        lastSelectedItem: null,
      };

    case "SET_ITEMS":
      return {
        ...state,
        items: action.payload,
        isLoading: false,
        error: null,
      };

    case "SELECT_ITEM": {
      const { name, ctrlKey, shiftKey, sortedItems } = action.payload;
      let newSelectedItems: Set<string>;
      let newLastSelected = name;

      if (shiftKey && state.lastSelectedItem) {
        // Shift+click: range selection using sorted items (fallback to state.items)
        const itemsToUse = sortedItems || state.items;
        newSelectedItems = getRangeSelection(
          itemsToUse,
          state.lastSelectedItem,
          name,
        );
        newLastSelected = state.lastSelectedItem; // Keep the original anchor
      } else if (ctrlKey) {
        // Ctrl+click: toggle selection
        newSelectedItems = new Set(state.selectedItems);
        if (newSelectedItems.has(name)) {
          newSelectedItems.delete(name);
        } else {
          newSelectedItems.add(name);
        }
      } else {
        // Normal click: single selection
        newSelectedItems = new Set([name]);
      }

      return {
        ...state,
        selectedItems: newSelectedItems,
        lastSelectedItem: newLastSelected,
        focusedItem: name,
      };
    }

    case "SELECT_ALL":
      return {
        ...state,
        selectedItems: new Set(state.items.map((item) => item.name)),
      };

    case "CLEAR_SELECTION":
      return {
        ...state,
        selectedItems: new Set<string>(),
        lastSelectedItem: null,
        focusedItem: null,
      };

    case "SET_SELECTION":
      return {
        ...state,
        selectedItems: action.payload,
        // Clear focus if selection is empty
        focusedItem: action.payload.size === 0 ? null : state.focusedItem,
        lastSelectedItem: action.payload.size === 0 ? null : state.lastSelectedItem,
      };

    case "SET_VIEW_MODE":
      return {
        ...state,
        viewMode: action.payload,
      };

    case "SET_SORT":
      return {
        ...state,
        sortBy: action.payload.sortBy,
        sortOrder: action.payload.sortOrder,
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case "SET_FOCUSED_ITEM":
      return {
        ...state,
        focusedItem: action.payload,
      };

    case "RESTORE_PREFERENCES":
      return {
        ...state,
        viewMode: action.payload.viewMode,
        sortBy: action.payload.sortBy,
        sortOrder: action.payload.sortOrder,
      };

    default:
      return state;
  }
}
