export interface SelectionState {
  selected: Set<string>;
  directories: Set<string>;
  anchor: string | null;
  focused: string | null;
}

export type SelectionAction =
  | {
      type: "click";
      path: string;
      toggle?: boolean;
      range?: boolean;
      page: string[];
    }
  | { type: "page"; paths: string[]; checked: boolean }
  | { type: "replace"; paths: Set<string> }
  | { type: "clear" }
  | { type: "focus"; path: string | null };

export function emptySelection(): SelectionState {
  return {
    selected: new Set(),
    directories: new Set(),
    anchor: null,
    focused: null,
  };
}

export function selectionReducer(
  state: SelectionState,
  action: SelectionAction,
  pageTypes: ReadonlyMap<string, boolean> = new Map(),
): SelectionState {
  const withSelected = (selected: Set<string>): SelectionState => ({
    ...state,
    selected,
    directories: new Set(
      [...selected].filter(
        (path) => pageTypes.get(path) ?? state.directories.has(path),
      ),
    ),
  });
  switch (action.type) {
    case "clear":
      return emptySelection();
    case "focus":
      return { ...state, focused: action.path };
    case "replace":
      return { ...withSelected(action.paths), anchor: null, focused: null };
    case "page": {
      const selected = new Set(state.selected);
      action.paths.forEach((path) =>
        action.checked ? selected.add(path) : selected.delete(path),
      );
      return withSelected(selected);
    }
    case "click": {
      let selected = new Set<string>();
      const anchorIndex = state.anchor ? action.page.indexOf(state.anchor) : -1;
      const targetIndex = action.page.indexOf(action.path);
      if (action.range && anchorIndex !== -1 && targetIndex !== -1) {
        selected = new Set(action.toggle ? state.selected : []);
        action.page
          .slice(
            Math.min(anchorIndex, targetIndex),
            Math.max(anchorIndex, targetIndex) + 1,
          )
          .forEach((path) => selected.add(path));
      } else if (action.toggle) {
        selected = new Set(state.selected);
        if (selected.has(action.path)) selected.delete(action.path);
        else selected.add(action.path);
      } else {
        selected.add(action.path);
      }
      return {
        ...withSelected(selected),
        focused: action.path,
        anchor: action.range && anchorIndex !== -1 ? state.anchor : action.path,
      };
    }
  }
}
