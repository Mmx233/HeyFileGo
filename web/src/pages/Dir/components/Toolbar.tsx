import { FC } from "react";
import { Box, Paper } from "@mui/material";
import BreadcrumbNavigator from "./BreadcrumbNavigator";
import ViewSwitcher from "./ViewSwitcher";
import SortSelector from "./SortSelector";
import { useFileBrowser } from "@/context/useFileBrowser";

export interface ToolbarProps {
  maxBreadcrumbItems?: number;
}

const Toolbar: FC<ToolbarProps> = ({ maxBreadcrumbItems = 4 }) => {
  const { state, dispatch, navigateTo } = useFileBrowser();

  const handleNavigate = (path: string) => {
    navigateTo(path);
  };

  const handleViewModeChange = (mode: "grid" | "list") => {
    dispatch({ type: "SET_VIEW_MODE", payload: mode });
  };

  const handleSortChange = (
    sortBy: "name" | "size",
    sortOrder: "asc" | "desc"
  ) => {
    dispatch({ type: "SET_SORT", payload: { sortBy, sortOrder } });
  };

  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        py: 1,
        mb: 2,
        borderRadius: 1,
        backgroundColor: "background.paper",
        flexWrap: "wrap",
        gap: 1,
      }}
    >
      {/* Breadcrumb navigation - takes available space */}
      <Box sx={{ flexGrow: 1, minWidth: 0, overflow: "hidden" }}>
        <BreadcrumbNavigator
          path={state.currentPath}
          onNavigate={handleNavigate}
          maxVisibleItems={maxBreadcrumbItems}
        />
      </Box>

      {/* Right side controls */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexShrink: 0,
        }}
      >
        <SortSelector
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
          onChange={handleSortChange}
        />
        <ViewSwitcher
          viewMode={state.viewMode}
          onChange={handleViewModeChange}
        />
      </Box>
    </Paper>
  );
};

export default Toolbar;
