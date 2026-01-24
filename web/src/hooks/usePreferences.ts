import { useEffect, useCallback } from 'react';
import { useFileBrowser } from '@/context/useFileBrowser';

// Preferences interface for localStorage
export interface ViewPreferences {
  viewMode: 'grid' | 'list';
  sortBy: 'name' | 'size';
  sortOrder: 'asc' | 'desc';
}

const STORAGE_KEY = 'fileBrowserPreferences';

// Default preferences
const defaultPreferences: ViewPreferences = {
  viewMode: 'grid',
  sortBy: 'name',
  sortOrder: 'asc',
};

// Validate preferences object
function isValidPreferences(obj: unknown): obj is ViewPreferences {
  if (typeof obj !== 'object' || obj === null) return false;
  const prefs = obj as Record<string, unknown>;
  return (
    (prefs.viewMode === 'grid' || prefs.viewMode === 'list') &&
    (prefs.sortBy === 'name' || prefs.sortBy === 'size') &&
    (prefs.sortOrder === 'asc' || prefs.sortOrder === 'desc')
  );
}

// Load preferences from localStorage
export function loadPreferences(): ViewPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultPreferences;
    
    const parsed = JSON.parse(stored);
    if (isValidPreferences(parsed)) {
      return parsed;
    }
    return defaultPreferences;
  } catch {
    return defaultPreferences;
  }
}

// Save preferences to localStorage
export function savePreferences(preferences: ViewPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Silently fail if localStorage is not available
  }
}

// Hook to manage preferences with FileBrowserContext
export function usePreferences() {
  const { state, dispatch } = useFileBrowser();

  // Load preferences on mount
  useEffect(() => {
    const prefs = loadPreferences();
    dispatch({
      type: 'RESTORE_PREFERENCES',
      payload: prefs,
    });
  }, [dispatch]);

  // Save preferences when they change
  useEffect(() => {
    savePreferences({
      viewMode: state.viewMode,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
    });
  }, [state.viewMode, state.sortBy, state.sortOrder]);

  // Setters
  const setViewMode = useCallback((mode: 'grid' | 'list') => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  }, [dispatch]);

  const setSort = useCallback((sortBy: 'name' | 'size', sortOrder: 'asc' | 'desc') => {
    dispatch({ type: 'SET_SORT', payload: { sortBy, sortOrder } });
  }, [dispatch]);

  return {
    viewMode: state.viewMode,
    sortBy: state.sortBy,
    sortOrder: state.sortOrder,
    setViewMode,
    setSort,
  };
}

export default usePreferences;
