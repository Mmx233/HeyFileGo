import { FC, useState, MouseEvent } from "react";
import { parsePath } from "@/utils/path";
import { calculateBreadcrumbDisplay } from "@/utils/breadcrumb";

import {
  Breadcrumbs,
  Link,
  Typography,
  Menu,
  MenuItem,
  IconButton,
  Box,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

export interface BreadcrumbNavigatorProps {
  path: string;
  onNavigate: (path: string) => void;
  maxVisibleItems?: number;
}

const BreadcrumbNavigator: FC<BreadcrumbNavigatorProps> = ({
  path,
  onNavigate,
  maxVisibleItems = 4,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const segments = parsePath(path);

  const { visible, collapsed, showEllipsis } = calculateBreadcrumbDisplay(
    segments,
    maxVisibleItems,
  );

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNavigateToRoot = () => {
    onNavigate("/");
  };

  const handleNavigateToSegment = (segmentIndex: number) => {
    // Build path from segments up to and including the clicked segment
    const targetPath = "/" + segments.slice(0, segmentIndex + 1).join("/");
    onNavigate(targetPath);
  };

  const handleNavigateToCollapsed = (collapsedIndex: number) => {
    // The collapsed segments start at index 1 in the original segments array
    const originalIndex = collapsedIndex + 1;
    const targetPath = "/" + segments.slice(0, originalIndex + 1).join("/");
    onNavigate(targetPath);
    handleMenuClose();
  };

  // Get the original index for a visible segment
  const getOriginalIndex = (visibleIndex: number): number => {
    if (!showEllipsis) {
      return visibleIndex;
    }
    if (visibleIndex === 0) {
      return 0;
    }
    // After ellipsis, segments are from the end
    const lastCount = maxVisibleItems - 2;
    return segments.length - lastCount + (visibleIndex - 1);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center" }}>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ flexGrow: 1 }}
      >
        {/* Root/Home link */}
        <Link
          component="button"
          underline="hover"
          color="inherit"
          onClick={handleNavigateToRoot}
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            border: "none",
            background: "none",
            "&:hover": { color: "primary.main" },
          }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Root
        </Link>

        {/* Ellipsis menu for collapsed segments */}
        {showEllipsis && (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              aria-label="Show collapsed path segments"
              sx={{ p: 0.5 }}
            >
              <MoreHorizIcon fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              {collapsed.map((segment, index) => (
                <MenuItem
                  key={index}
                  onClick={() => handleNavigateToCollapsed(index)}
                >
                  {segment}
                </MenuItem>
              ))}
            </Menu>
          </Box>
        )}

        {/* Visible segments */}
        {visible.map((segment, visibleIndex) => {
          const originalIndex = getOriginalIndex(visibleIndex);
          const isLast = originalIndex === segments.length - 1;

          if (isLast) {
            return (
              <Typography key={originalIndex} color="text.primary">
                {segment}
              </Typography>
            );
          }

          return (
            <Link
              key={originalIndex}
              component="button"
              underline="hover"
              color="inherit"
              onClick={() => handleNavigateToSegment(originalIndex)}
              sx={{
                cursor: "pointer",
                border: "none",
                background: "none",
                "&:hover": { color: "primary.main" },
              }}
            >
              {segment}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

export default BreadcrumbNavigator;
