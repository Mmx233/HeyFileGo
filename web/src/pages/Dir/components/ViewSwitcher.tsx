import { FC } from "react";
import { ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";

export interface ViewSwitcherProps {
  viewMode: "grid" | "list";
  onChange: (mode: "grid" | "list") => void;
}

const ViewSwitcher: FC<ViewSwitcherProps> = ({ viewMode, onChange }) => {
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: "grid" | "list" | null
  ) => {
    // Prevent deselection - always keep one mode selected
    if (newMode !== null) {
      onChange(newMode);
    }
  };

  return (
    <ToggleButtonGroup
      value={viewMode}
      exclusive
      onChange={handleChange}
      aria-label="view mode"
      size="small"
    >
      <ToggleButton value="grid" aria-label="grid view">
        <Tooltip title="Grid view">
          <GridViewIcon fontSize="small" />
        </Tooltip>
      </ToggleButton>
      <ToggleButton value="list" aria-label="list view">
        <Tooltip title="List view">
          <ViewListIcon fontSize="small" />
        </Tooltip>
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

export default ViewSwitcher;
