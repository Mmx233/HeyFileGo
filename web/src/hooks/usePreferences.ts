import { useState } from "react";
import type { SortBy, SortOrder } from "@/pages/Dir/location";

export type ViewMode = "grid" | "list";
interface Preferences {
  viewMode: ViewMode;
  sortBy: SortBy;
  sortOrder: SortOrder;
}
const STORAGE_KEY = "fileBrowserPreferences";

export function savePreferences(preferences: Preferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Preferences still work for this session when storage is unavailable.
  }
}

export function usePreferences() {
  const [initial] = useState<Preferences>(() => {
    const defaults: Preferences = {
      viewMode: "list",
      sortBy: "name",
      sortOrder: "asc",
    };
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return {
        viewMode: stored?.viewMode === "grid" ? "grid" : "list",
        sortBy:
          stored?.sortBy === "size" || stored?.sortBy === "modified"
            ? stored.sortBy
            : "name",
        sortOrder: stored?.sortOrder === "desc" ? "desc" : "asc",
      };
    } catch {
      return defaults;
    }
  });
  const [viewMode, setViewMode] = useState(initial.viewMode);
  return {
    viewMode,
    setViewMode,
    initialSort: initial.sortBy,
    initialOrder: initial.sortOrder,
  };
}
