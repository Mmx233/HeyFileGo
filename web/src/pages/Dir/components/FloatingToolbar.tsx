import { FC } from "react";

import { Box, Paper, Button, Typography, Fade, IconButton } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import CloseIcon from "@mui/icons-material/Close";

export interface FloatingToolbarProps {
  selectedCount: number;
  visible: boolean;
  onDownload: () => void;
  onClearSelection: () => void;
}

const FloatingToolbar: FC<FloatingToolbarProps> = ({
  selectedCount,
  visible,
  onDownload,
  onClearSelection,
}) => {
  return (
    <Fade in={visible} timeout={200}>
      <Paper
        elevation={4}
        sx={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          display: visible ? "flex" : "none",
          alignItems: "center",
          gap: { xs: 1, sm: 2 },
          px: { xs: 1.5, sm: 2 },
          py: 1,
          borderRadius: 2,
          backgroundColor: "background.paper",
          zIndex: 1100,
          maxWidth: "calc(100vw - 32px)",
        }}
      >
        {/* Selection count */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ whiteSpace: "nowrap", display: { xs: "none", sm: "block" } }}
        >
          {selectedCount} {selectedCount === 1 ? "item" : "items"}
        </Typography>

        {/* Action buttons */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            size="small"
            onClick={onDownload}
            color="primary"
            aria-label="Download"
            sx={{ display: { xs: "flex", sm: "none" } }}
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            onClick={onDownload}
            variant="outlined"
            sx={{ display: { xs: "none", sm: "flex" }, whiteSpace: "nowrap" }}
          >
            Download
          </Button>
        </Box>

        {/* Clear selection button */}
        <IconButton
          size="small"
          onClick={onClearSelection}
          aria-label="Clear selection"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Paper>
    </Fade>
  );
};

export default FloatingToolbar;
