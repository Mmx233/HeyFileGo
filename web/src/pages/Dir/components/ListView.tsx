import { FC, MouseEvent } from "react";

import FileRow from "./FileRow";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";

export interface ListViewProps {
  items: Dir.Info[];
  selectedItems: Set<string>;
  focusedItem: string | null;
  sortBy: "name" | "size";
  sortOrder: "asc" | "desc";
  onItemClick: (item: Dir.Info, event: MouseEvent) => void;
  onItemDoubleClick: (item: Dir.Info) => void;
  onContextMenu: (event: MouseEvent, item?: Dir.Info) => void;
  onHeaderClick: (column: "name" | "size") => void;
}

const ListView: FC<ListViewProps> = ({
  items,
  selectedItems,
  focusedItem,
  sortBy,
  sortOrder,
  onItemClick,
  onItemDoubleClick,
  onContextMenu,
  onHeaderClick,
}) => {
  return (
    <Box
      sx={{ width: "100%" }}
      onClick={(e) => e.stopPropagation()}
    >
      <TableContainer>
        <Table size="small" sx={{ minWidth: 300 }}>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortBy === "name"}
                  direction={sortBy === "name" ? sortOrder : "asc"}
                  onClick={() => onHeaderClick("name")}
                >
                  Name
                </TableSortLabel>
              </TableCell>
              <TableCell align="right" sx={{ width: 100 }}>
                <TableSortLabel
                  active={sortBy === "size"}
                  direction={sortBy === "size" ? sortOrder : "asc"}
                  onClick={() => onHeaderClick("size")}
                >
                  Size
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <FileRow
                key={item.name}
                item={item}
                isSelected={selectedItems.has(item.name)}
                isFocused={focusedItem === item.name}
                onClick={(e) => {
                  e.stopPropagation();
                  onItemClick(item, e);
                }}
                onDoubleClick={() => onItemDoubleClick(item)}
                onContextMenu={(e) => {
                  e.stopPropagation();
                  onContextMenu(e, item);
                }}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ListView;
