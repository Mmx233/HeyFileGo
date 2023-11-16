import { FC } from "react";

import {
  Box,
  CircularProgress,
  CircularProgressProps,
  Typography,
} from "@mui/material";

interface Props extends CircularProgressProps {
  value: number;
}

export const CircularProgressWithLabel: FC<Props> = (props) => {
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
};
export default CircularProgressWithLabel
