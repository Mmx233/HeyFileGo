import { useCallback, useState } from "react";
import {
  emptySelection,
  selectionReducer,
  type SelectionAction,
} from "@/context/fileBrowserReducer";

export function useSelection(
  scope: string,
  pageTypes: ReadonlyMap<string, boolean>,
) {
  const [stored, setStored] = useState(() => ({ scope, ...emptySelection() }));
  // Reset during render so actions never see the preceding directory's selection.
  if (stored.scope !== scope) setStored({ scope, ...emptySelection() });
  const state = stored.scope === scope ? stored : emptySelection();
  const dispatch = useCallback(
    (action: SelectionAction) => {
      setStored((previous) => ({
        scope,
        ...selectionReducer(
          previous.scope === scope ? previous : emptySelection(),
          action,
          pageTypes,
        ),
      }));
    },
    [scope, pageTypes],
  );
  return { ...state, dispatch };
}
