import { FC, MouseEvent } from "react";
import { getFileIcon } from "@/utils/fileIcon";
import { sizeFmt } from "@/utils/fmt";

import { Box, TableRow, TableCell, Typography } from "@mui/material";

export interface FileRowProps {
  item: Dir.Info;
  isSelected: boolean;
  isFocused: boolean;
  onClick: (event: MouseEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (event: MouseEvent) => void;
}

const FileRow: FC<FileRowProps> = ({
  item,
  isSelected,
  isFocused,
  onClick,
  onDoubleClick,
  onContextMenu,
}) => {
  const IconComponent = getFileIcon(item.name, item.is_dir);

  return (
    <TableRow
      hover
      selected={isSelected}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      sx={{
        cursor: "pointer",
        outline: isFocused ? 2 : 0,
        outlineColor: "primary.main",
        outlineOffset: -2,
        "&.Mui-selected": {
          backgroundColor: "action.selected",
        },
        "&.Mui-selected:hover": {
          backgroundColor: "action.selected",
        },
      }}
    >
      {/* Name column with icon */}
      <TableCell>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <IconComponent
            sx={{
              fontSize: 24,
              color: item.is_dir ? "primary.main" : "text.secondary",
              flexShrink: 0,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontWeight: isSelected ? 500 : 400,
            }}
            title={item.name}
          >
            {item.name}
          </Typography>
        </Box>
      </TableCell>

      {/* Size column */}
      <TableCell align="right" sx={{ width: 100 }}>
        <Typography variant="body2" color="text.secondary">
          {item.is_dir ? "—" : item.size !== undefined ? sizeFmt(item.size) : "—"}
        </Typography>
      </TableCell>
    </TableRow>
  );
};

export default FileRow;
