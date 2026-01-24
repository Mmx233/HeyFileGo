import { FC, useState, MouseEvent } from "react";

import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import SortIcon from "@mui/icons-material/Sort";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CheckIcon from "@mui/icons-material/Check";

export interface SortSelectorProps {
  sortBy: "name" | "size";
  sortOrder: "asc" | "desc";
  onChange: (sortBy: "name" | "size", sortOrder: "asc" | "desc") => void;
}

const SortSelector: FC<SortSelectorProps> = ({
  sortBy,
  sortOrder,
  onChange,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSortByChange = (newSortBy: "name" | "size") => {
    onChange(newSortBy, sortOrder);
    handleClose();
  };

  const handleSortOrderChange = (newSortOrder: "asc" | "desc") => {
    onChange(sortBy, newSortOrder);
    handleClose();
  };

  const getSortLabel = () => {
    const byLabel = sortBy === "name" ? "Name" : "Size";
    const orderLabel = sortOrder === "asc" ? "↑" : "↓";
    return `${byLabel} ${orderLabel}`;
  };

  return (
    <>
      <Button
        id="sort-button"
        aria-controls={open ? "sort-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
        startIcon={<SortIcon />}
        size="small"
        variant="text"
        color="inherit"
      >
        {getSortLabel()}
      </Button>
      <Menu
        id="sort-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        slotProps={{
          list: {
            "aria-labelledby": "sort-button",
          },
        }}
      >
        <MenuItem onClick={() => handleSortByChange("name")}>
          <ListItemIcon>
            {sortBy === "name" && <CheckIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>Name</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleSortByChange("size")}>
          <ListItemIcon>
            {sortBy === "size" && <CheckIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>Size</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleSortOrderChange("asc")}>
          <ListItemIcon>
            {sortOrder === "asc" ? (
              <CheckIcon fontSize="small" />
            ) : (
              <ArrowUpwardIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>Ascending</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleSortOrderChange("desc")}>
          <ListItemIcon>
            {sortOrder === "desc" ? (
              <CheckIcon fontSize="small" />
            ) : (
              <ArrowDownwardIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>Descending</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default SortSelector;
