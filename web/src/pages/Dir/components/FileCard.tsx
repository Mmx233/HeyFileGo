import { FC, MouseEvent } from "react";
import { Box, Card, CardActionArea, Typography } from "@mui/material";
import { getFileIcon } from "@/utils/fileIcon";
import { sizeFmt } from "@/utils/fmt";

export interface FileCardProps {
  item: Dir.Info;
  isSelected: boolean;
  isFocused: boolean;
  onClick: (event: MouseEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (event: MouseEvent) => void;
}

const FileCard: FC<FileCardProps> = ({
  item,
  isSelected,
  isFocused,
  onClick,
  onDoubleClick,
  onContextMenu,
}) => {
  const IconComponent = getFileIcon(item.name, item.is_dir);

  return (
    <Card
      elevation={isSelected ? 3 : 1}
      data-name={item.name}
      sx={{
        width: "100%",
        aspectRatio: "1 / 1",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.15s ease-in-out",
        backgroundColor: isSelected ? "action.selected" : "background.paper",
        border: (isFocused || isSelected) ? 2 : 1,
        borderColor: (isFocused || isSelected) ? "primary.main" : "divider",
        "&:hover": {
          elevation: 4,
          backgroundColor: isSelected ? "action.selected" : "action.hover",
        },
      }}
      onContextMenu={onContextMenu}
    >
      <CardActionArea
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          p: 1.5,
        }}
      >
        {/* Icon */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 1,
            color: item.is_dir ? "primary.main" : "text.secondary",
          }}
        >
          <IconComponent sx={{ fontSize: 48 }} />
        </Box>

        {/* Name */}
        <Typography
          variant="body2"
          align="center"
          sx={{
            width: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            wordBreak: "break-word",
            lineHeight: 1.3,
            fontWeight: isSelected ? 500 : 400,
          }}
          title={item.name}
        >
          {item.name}
        </Typography>

        {/* Size (only for files) */}
        {!item.is_dir && item.size !== undefined && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5 }}
          >
            {sizeFmt(item.size)}
          </Typography>
        )}
      </CardActionArea>
    </Card>
  );
};

export default FileCard;
