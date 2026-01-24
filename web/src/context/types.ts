import React from "react";
import { FileBrowserState, FileBrowserAction } from "./fileBrowserReducer";

// Context value interface
export interface FileBrowserContextValue {
  state: FileBrowserState;
  dispatch: React.Dispatch<FileBrowserAction>;
  navigateTo: (path: string) => Promise<void>;
  refresh: () => Promise<void>;
}
