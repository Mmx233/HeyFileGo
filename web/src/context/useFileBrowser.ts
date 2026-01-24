import { useContext } from "react";
import FileBrowserContext from "./FileBrowserContext";
import { FileBrowserContextValue } from "./types";

// Custom hook to use the context
export function useFileBrowser(): FileBrowserContextValue {
  const context = useContext(FileBrowserContext);
  if (!context) {
    throw new Error("useFileBrowser must be used within a FileBrowserProvider");
  }
  return context;
}
