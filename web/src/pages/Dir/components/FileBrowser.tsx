import { FC, MouseEvent } from "react";

import { Box, Typography, Button, Alert } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

import GridView from "./GridView";
import ListView from "./ListView";
import EmptyState from "./EmptyState";
import LoadingFullContainer from "@/components/LoadingFullContainer";

export interface FileBrowserProps {
  items: Dir.Info[];
  viewMode: "grid" | "list";
  selectedItems: Set<string>;
  focusedItem: string | null;
  sortBy: "name" | "size";
  sortOrder: "asc" | "desc";
  isLoading: boolean;
  error: string | null;
  onItemClick: (item: Dir.Info, event: MouseEvent) => void;
  onItemDoubleClick: (item: Dir.Info) => void;
  onContextMenu: (event: MouseEvent, item?: Dir.Info) => void;
  onEmptyClick: () => void;
  onHeaderClick: (column: "name" | "size") => void;
  onRetry: () => void;
  onSelectionBoxChange: (selectedNames: Set<string>) => void;
}

const FileBrowser: FC<FileBrowserProps> = ({
  items,
  viewMode,
  selectedItems,
  focusedItem,
  sortBy,
  sortOrder,
  isLoading,
  error,
  onItemClick,
  onItemDoubleClick,
  onContextMenu,
  onEmptyClick,
  onHeaderClick,
  onRetry,
  onSelectionBoxChange,
}) => {
  // Handle click on empty space to clear selection
  const handleContainerClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      onEmptyClick();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ height: "100%", minHeight: 200 }}>
        <LoadingFullContainer />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 8,
          px: 2,
        }}
      >
        <Alert severity="error" sx={{ mb: 2, maxWidth: 400 }}>
          <Typography variant="body2">{error}</Typography>
        </Alert>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
        >
          Retry
        </Button>
      </Box>
    );
  }

  // Empty state
  if (items.length === 0) {
    return <EmptyState />;
  }

  // Render appropriate view
  return (
    <Box
      sx={{
        height: "100%",
        overflow: "auto",
      }}
      onClick={handleContainerClick}
    >
      {viewMode === "grid" ? (
        <GridView
          items={items}
          selectedItems={selectedItems}
          focusedItem={focusedItem}
          onItemClick={onItemClick}
          onItemDoubleClick={onItemDoubleClick}
          onContextMenu={onContextMenu}
          onSelectionBoxChange={onSelectionBoxChange}
        />
      ) : (
        <ListView
          items={items}
          selectedItems={selectedItems}
          focusedItem={focusedItem}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onItemClick={onItemClick}
          onItemDoubleClick={onItemDoubleClick}
          onContextMenu={onContextMenu}
          onHeaderClick={onHeaderClick}
        />
      )}
    </Box>
  );
};

export default FileBrowser;
