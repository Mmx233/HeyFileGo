import { FC } from "react";
import { Box } from "@mui/material";

export interface SelectionBoxProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const SelectionBox: FC<SelectionBoxProps> = ({ startX, startY, endX, endY }) => {
  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  return (
    <Box
      sx={{
        position: "absolute",
        left,
        top,
        width,
        height,
        backgroundColor: "primary.main",
        opacity: 0.1,
        border: 1,
        borderColor: "primary.main",
        pointerEvents: "none",
        zIndex: 1000,
      }}
    />
  );
};

export default SelectionBox;
