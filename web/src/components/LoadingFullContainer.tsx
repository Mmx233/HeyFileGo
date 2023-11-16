import { FC } from "react";

import { CircularProgress, Stack, CircularProgressProps } from "@mui/material";

export const LoadingFullContainer: FC<CircularProgressProps> = ({
  size=50,
  ...props
}) => {
  return (
    <Stack
      sx={{
        height: "100%",
        width: "100%",
      }}
      justifyContent={"center"}
      alignItems={"center"}
    >
      <CircularProgress size={size} {...props} />
    </Stack>
  );
};
export default LoadingFullContainer;
