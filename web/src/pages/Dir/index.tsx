import { FC, useEffect, useState, useCallback, MouseEvent } from "react";
import { Box, Container, Snackbar, Alert } from "@mui/material";

import { FileBrowserProvider } from "@/context/FileBrowserContext";
import { useFileBrowser } from "@/context/useFileBrowser";
import { usePreferences } from "@/hooks/usePreferences";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { sortItems } from "@/utils/sort";
import { joinPath } from "@/utils/path";

import Toolbar from "./components/Toolbar";
import FileBrowser from "./components/FileBrowser";
import FloatingToolbar from "./components/FloatingToolbar";
import ContextMenu, { ContextMenuAction } from "./components/ContextMenu";

// Context menu state interface
interface ContextMenuState {
  open: boolean;
  position: { x: number; y: number };
  targetItem?: Dir.Info;
}

// Inner component that uses the context
const DirPageContent: FC = () => {
  const { state, dispatch, navigateTo, refresh } = useFileBrowser();
  const { items, selectedItems, focusedItem, viewMode, sortBy, sortOrder, isLoading, error, currentPath } = state;

  // Initialize preferences (loads from localStorage)
  usePreferences();

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    open: false,
    position: { x: 0, y: 0 },
  });

  // Snackbar state for notifications
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  // Sort items before rendering (safeguard against undefined/null)
  const sortedItems = sortItems(items || [], sortBy, sortOrder);

  // Load initial directory on mount
  useEffect(() => {
    navigateTo(currentPath);
  }, []);

  // Handle opening a folder
  const handleOpenFolder = useCallback(
    (item: Dir.Info) => {
      const newPath = joinPath(currentPath, item.name);
      navigateTo(newPath);
    },
    [currentPath, navigateTo]
  );

  // Handle downloading a file
  const handleDownloadFile = useCallback(
    (item: Dir.Info) => {
      const filePath = currentPath === "/" ? item.name : `${currentPath.replace(/^\/+/, "")}/${item.name}`;
      const downloadUrl = `/api/dir/file?${new URLSearchParams({ path: filePath })}`;
      
      // Use anchor element for download instead of window.open
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [currentPath]
  );

  // Keyboard navigation
  useKeyboardNavigation({
    sortedItems,
    onOpenFolder: handleOpenFolder,
    onDownloadFile: handleDownloadFile,
    enabled: true,
  });

  // Handle item click (selection)
  const handleItemClick = useCallback(
    (item: Dir.Info, event: MouseEvent) => {
      dispatch({
        type: "SELECT_ITEM",
        payload: {
          name: item.name,
          ctrlKey: event.ctrlKey || event.metaKey,
          shiftKey: event.shiftKey,
          sortedItems,
        },
      });
    },
    [dispatch, sortedItems]
  );

  // Handle item double click
  const handleItemDoubleClick = useCallback(
    (item: Dir.Info) => {
      if (item.is_dir) {
        handleOpenFolder(item);
      } else {
        handleDownloadFile(item);
      }
    },
    [handleOpenFolder, handleDownloadFile]
  );

  // Handle context menu
  const handleContextMenu = useCallback(
    (event: MouseEvent, item?: Dir.Info) => {
      event.preventDefault();
      setContextMenu({
        open: true,
        position: { x: event.clientX, y: event.clientY },
        targetItem: item,
      });
    },
    []
  );

  // Close context menu
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, open: false }));
  }, []);

  // Handle context menu action
  const handleContextMenuAction = useCallback(
    (action: ContextMenuAction) => {
      const targetItem = contextMenu.targetItem;

      switch (action) {
        case "open":
          if (targetItem?.is_dir) {
            handleOpenFolder(targetItem);
          }
          break;

        case "download":
          if (targetItem && !targetItem.is_dir) {
            handleDownloadFile(targetItem);
          } else if (selectedItems.size > 0) {
            // Download first selected file
            const firstSelected = items.find(
              (item) => selectedItems.has(item.name) && !item.is_dir
            );
            if (firstSelected) {
              handleDownloadFile(firstSelected);
            }
          }
          break;

        case "refresh":
          refresh();
          break;
      }
    },
    [contextMenu.targetItem, selectedItems, items, currentPath, handleOpenFolder, handleDownloadFile, refresh]
  );

  // Handle empty click (clear selection)
  const handleEmptyClick = useCallback(() => {
    dispatch({ type: "CLEAR_SELECTION" });
  }, [dispatch]);

  // Handle selection box change
  const handleSelectionBoxChange = useCallback(
    (selectedNames: Set<string>) => {
      dispatch({ type: "SET_SELECTION", payload: selectedNames });
    },
    [dispatch]
  );

  // Handle header click for sorting
  const handleHeaderClick = useCallback(
    (column: "name" | "size") => {
      if (sortBy === column) {
        dispatch({
          type: "SET_SORT",
          payload: { sortBy, sortOrder: sortOrder === "asc" ? "desc" : "asc" },
        });
      } else {
        dispatch({
          type: "SET_SORT",
          payload: { sortBy: column, sortOrder: "asc" },
        });
      }
    },
    [sortBy, sortOrder, dispatch]
  );

  // Handle floating toolbar download
  const handleToolbarDownload = useCallback(() => {
    const selectedFiles = items.filter(
      (item) => selectedItems.has(item.name) && !item.is_dir
    );
    // Download all selected files
    selectedFiles.forEach((file) => {
      handleDownloadFile(file);
    });
  }, [items, selectedItems, handleDownloadFile]);

  // Handle clear selection
  const handleClearSelection = useCallback(() => {
    dispatch({ type: "CLEAR_SELECTION" });
  }, [dispatch]);

  // Close snackbar
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  // Check if selection contains only files (no folders)
  const hasOnlyFiles = selectedItems.size > 0 && 
    Array.from(selectedItems).every((name) => {
      const item = items.find((i) => i.name === name);
      return item && !item.is_dir;
    });

  return (
    <Box sx={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column" }}>
      <Container sx={{ py: 1.5, flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Toolbar with breadcrumb, sort, and view switcher */}
        <Toolbar />

        {/* File browser */}
        <Box sx={{ flexGrow: 1, overflow: "auto" }}>
          <FileBrowser
            items={sortedItems}
            viewMode={viewMode}
            selectedItems={selectedItems}
            focusedItem={focusedItem}
            sortBy={sortBy}
            sortOrder={sortOrder}
            isLoading={isLoading}
            error={error}
            onItemClick={handleItemClick}
            onItemDoubleClick={handleItemDoubleClick}
            onContextMenu={handleContextMenu}
            onEmptyClick={handleEmptyClick}
            onHeaderClick={handleHeaderClick}
            onRetry={refresh}
            onSelectionBoxChange={handleSelectionBoxChange}
          />
        </Box>
      </Container>

      {/* Floating toolbar for selected items (only show when only files are selected, no folders) */}
      <FloatingToolbar
        selectedCount={selectedItems.size}
        visible={hasOnlyFiles}
        onDownload={handleToolbarDownload}
        onClearSelection={handleClearSelection}
      />

      {/* Context menu */}
      <ContextMenu
        open={contextMenu.open}
        position={contextMenu.position}
        targetItem={contextMenu.targetItem}
        selectedItems={selectedItems}
        hasOnlyFiles={hasOnlyFiles}
        onClose={handleCloseContextMenu}
        onAction={handleContextMenuAction}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Main Dir page component with provider
const Dir: FC = () => {
  return (
    <FileBrowserProvider initialPath="/">
      <DirPageContent />
    </FileBrowserProvider>
  );
};

export default Dir;
