import { createContext, useReducer, useCallback, ReactNode, useEffect } from "react";
import useSWR from "swr";
import { FileBrowserContextValue } from "./types";
import { fileBrowserReducer, initialState } from "./fileBrowserReducer";
import api from "@/network/api";

// Create context
const FileBrowserContext = createContext<FileBrowserContextValue | null>(null);

// Provider props
interface FileBrowserProviderProps {
  children: ReactNode;
  initialPath?: string;
}

// Fetcher function for SWR
const fetcher = async (path: string): Promise<Dir.Info[]> => {
  const queryPath = path === "/" ? "" : path.replace(/^\/+/, "");
  const { data: { data } } = await api.get<ApiResponse<Dir.Info[]>>("dir/", {
    params: { path: queryPath },
  });
  return data || [];
};

// Provider component
export function FileBrowserProvider({
  children,
  initialPath = "/",
}: FileBrowserProviderProps) {
  const [state, dispatch] = useReducer(fileBrowserReducer, {
    ...initialState,
    currentPath: initialPath,
  });

  // Use SWR for data fetching with caching
  const { data, error, isLoading, mutate } = useSWR(
    state.currentPath,
    fetcher,
    {
      revalidateOnFocus: false, 
      revalidateOnReconnect: false,
    }
  );

  // Sync SWR state with reducer state
  useEffect(() => {
    if (isLoading) {
      dispatch({ type: "SET_LOADING", payload: true });
    }
  }, [isLoading]);

  useEffect(() => {
    if (data) {
      dispatch({ type: "SET_ITEMS", payload: data });
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      const errorMsg = error.response?.data?.msg || "Failed to load directory contents";
      dispatch({ type: "SET_ERROR", payload: errorMsg });
    }
  }, [error]);

  const navigateTo = useCallback((path: string) => {
    dispatch({ type: "SET_PATH", payload: path });
  }, []);

  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  const contextValue: FileBrowserContextValue = {
    state,
    dispatch,
    navigateTo,
    refresh,
  };

  return (
    <FileBrowserContext.Provider value={contextValue}>
      {children}
    </FileBrowserContext.Provider>
  );
}

export default FileBrowserContext;
