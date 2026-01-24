import { FC, MouseEvent, useRef } from "react";

import FileCard from "./FileCard";
import SelectionBox from "./SelectionBox";
import { Box } from "@mui/material";
import { useSelectionBox } from "@/hooks/useSelectionBox";

export interface GridViewProps {
  items: Dir.Info[];
  selectedItems: Set<string>;
  focusedItem: string | null;
  onItemClick: (item: Dir.Info, event: MouseEvent) => void;
  onItemDoubleClick: (item: Dir.Info) => void;
  onContextMenu: (event: MouseEvent, item?: Dir.Info) => void;
  onSelectionBoxChange: (selectedNames: Set<string>) => void;
}

const GridView: FC<GridViewProps> = ({
  items,
  selectedItems,
  focusedItem,
  onItemClick,
  onItemDoubleClick,
  onContextMenu,
  onSelectionBoxChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { isSelecting, selectionBox } = useSelectionBox({
    containerRef,
    itemSelector: "[data-name]",
    onSelectionChange: onSelectionBoxChange,
    enabled: true,
  });

  const handleContextMenu = (e: MouseEvent) => {
    if (e.target === containerRef.current) {
      onContextMenu(e);
    }
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(auto-fill, 120px)",
          sm: "repeat(auto-fill, 140px)",
          md: "repeat(auto-fill, 150px)",
        },
        gap: 2,
        p: 2,
        justifyContent: "center",
        alignContent: "start",
        position: "relative",
        userSelect: isSelecting ? "none" : "auto",
        overflow: "hidden",
        minHeight: "100%",
      }}
      onContextMenu={handleContextMenu}
    >
      {items.map((item) => (
        <FileCard
          key={item.name}
          item={item}
          isSelected={selectedItems.has(item.name)}
          isFocused={focusedItem === item.name}
          onClick={(e) => onItemClick(item, e)}
          onDoubleClick={() => onItemDoubleClick(item)}
          onContextMenu={(e) => onContextMenu(e, item)}
        />
      ))}
      {isSelecting && selectionBox && (
        <SelectionBox
          startX={selectionBox.startX}
          startY={selectionBox.startY}
          endX={selectionBox.endX}
          endY={selectionBox.endY}
        />
      )}
    </Box>
  );
};

export default GridView;
