import React from "react";
import { FileBrowserState, FileBrowserAction } from "./fileBrowserReducer";

// Context value interface
export interface FileBrowserContextValue {
  state: FileBrowserState;
  dispatch: React.Dispatch<FileBrowserAction>;
  navigateTo: (path: string) => void;
  refresh: () => void;
}
