import { FC, useEffect } from "react";
import { sizeFmt } from "@/utils/fmt.ts";

import {
  TableRow,
  TableCell,
  Fade,
  Stack,
  Typography,
  CircularProgress,
  CircularProgressProps,
  Box,
} from "@mui/material";

interface Props {
  file: File;
}

export const Item: FC<Props> = ({ file }) => {
  useEffect(() => {}, []);
  return (
    <Fade in>
      <TableRow>
        <TableCell>{`名称: ${file.name}`}</TableCell>
        <TableCell>{`大小: ${sizeFmt(file.size)}`}</TableCell>
        <TableCell sx={{ padding: "unset", minWidth: "7rem" }}>
          <Stack flexDirection={"row"} alignItems={"center"}>
            <Typography mr={1.5}>状态:</Typography>
            <CircularProgressWithLabel size={30} value={50} />
          </Stack>
        </TableCell>
      </TableRow>
    </Fade>
  );
};
export default Item;

function CircularProgressWithLabel(
  props: CircularProgressProps & { value: number },
) {
  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <CircularProgress variant="determinate" {...props} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="caption"
          component="div"
          color="text.secondary"
          fontSize={"12px"}
        >{`${Math.round(props.value)}`}</Typography>
      </Box>
    </Box>
  );
}
