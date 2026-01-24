import { FC, useCallback } from "react";

import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import RefreshIcon from "@mui/icons-material/Refresh";

export type ContextMenuAction = "download" | "refresh" | "open";

export interface ContextMenuProps {
  open: boolean;
  position: { x: number; y: number };
  targetItem?: Dir.Info;
  selectedItems: Set<string>;
  hasOnlyFiles: boolean;
  onClose: () => void;
  onAction: (action: ContextMenuAction) => void;
}

const ContextMenu: FC<ContextMenuProps> = ({
  open,
  position,
  targetItem,
  selectedItems,
  hasOnlyFiles,
  onClose,
  onAction,
}) => {
  const handleAction = useCallback(
    (action: ContextMenuAction) => {
      onAction(action);
      onClose();
    },
    [onAction, onClose],
  );

  const isMultipleSelection = selectedItems.size > 1;
  const isFolder = targetItem?.is_dir ?? false;
  const isFile = targetItem && !targetItem.is_dir;

  // Determine what menu items to show based on context
  const showOpenOption = isFolder && !isMultipleSelection;
  const showDownloadOption = isFile && !isMultipleSelection;
  const showRefreshOption = !targetItem; // Only show refresh when clicking on empty space

  // Don't show menu for multi-selection with folders
  const shouldHide = isMultipleSelection && !hasOnlyFiles;

  // Prevent browser context menu on backdrop
  const handleBackdropContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <Menu
      open={open && !shouldHide}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={{ top: position.y, left: position.x }}
      slotProps={{
        paper: {
          sx: {
            minWidth: 180,
            boxShadow: 3,
          },
          onContextMenu: handleBackdropContextMenu,
        },
        root: {
          onContextMenu: handleBackdropContextMenu,
        },
      }}
    >
      {/* Open folder option */}
      {showOpenOption && (
        <MenuItem onClick={() => handleAction("open")}>
          <ListItemIcon>
            <FolderOpenIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Open</ListItemText>
        </MenuItem>
      )}

      {/* Download option */}
      {showDownloadOption && (
        <MenuItem onClick={() => handleAction("download")}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {isMultipleSelection
              ? `Download (${selectedItems.size} items)`
              : "Download"}
          </ListItemText>
        </MenuItem>
      )}

      {/* Divider before refresh if there are other options */}
      {showRefreshOption && (showOpenOption || showDownloadOption) && (
        <Divider />
      )}

      {/* Refresh option - only on empty space */}
      {showRefreshOption && (
        <MenuItem onClick={() => handleAction("refresh")}>
          <ListItemIcon>
            <RefreshIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Refresh</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
};

export default ContextMenu;
