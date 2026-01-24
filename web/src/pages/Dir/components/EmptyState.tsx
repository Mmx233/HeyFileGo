import { FC } from "react";

import { Box, Typography } from "@mui/material";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";

export interface EmptyStateProps {
  message?: string;
}

const EmptyState: FC<EmptyStateProps> = ({
  message = "This folder is empty",
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 8,
        px: 2,
        color: "text.secondary",
      }}
    >
      <FolderOpenIcon
        sx={{
          fontSize: 80,
          mb: 2,
          opacity: 0.5,
        }}
      />
      <Typography variant="h6" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

export default EmptyState;
