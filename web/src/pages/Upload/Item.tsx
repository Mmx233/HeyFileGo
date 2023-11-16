import { FC, useEffect, useState, useRef } from "react";
import { api } from "@/network/api.ts";
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
  IconButton,
} from "@mui/material";
import { HighlightOff, CheckCircleOutline, Clear } from "@mui/icons-material";

interface Props {
  file: File;
}

export const Item: FC<Props> = ({ file }) => {
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [isUploadSuccess, setIsUploadSuccess] = useState(false);
  const [process, setProcess] = useState(0);

  const abortController = useRef(new AbortController());
  const uploadConcurrent = useRef(false);

  const onUpload = async () => {
    if (uploadConcurrent.current) return;
    uploadConcurrent.current = true;
    try {
      const form = new FormData();
      form.append("file", file);
      await api.post("upload", form, {
        signal: abortController.current.signal,
        onUploadProgress: (ev) => {
          setProcess((ev.loaded / ev.total!) * 100);
        },
      });
      setIsUploadSuccess(true);
    } catch (err: any) {
      if (err.response?.data?.msg) setUploadErr(err.response.data.msg);
      else {
        console.log(err);
        switch (err.code) {
          case "ERR_CANCELED":
            setUploadErr("用户取消");
            break;
          default:
            setUploadErr("未知错误");
        }
      }
    }
  };

  useEffect(() => {
    onUpload();
  }, []);

  const renderStatus = () => {
    if (isUploadSuccess)
      return <CheckCircleOutline fontSize={"small"} color={"success"} />;
    if (uploadErr)
      return (
        <>
          <HighlightOff fontSize={"small"} color={"error"} />
          <Typography ml={0.5} variant={"body2"} color={"text.secondary"}>
            {uploadErr}
          </Typography>
        </>
      );
    return (
      <>
        <CircularProgressWithLabel size={30} value={process} />
        <IconButton
          size={"small"}
          sx={{
            transition: "color 0.15s",
            "&:hover": {
              color: "error.main",
            },
          }}
          onClick={() => abortController.current.abort()}
        >
          <Clear fontSize={"small"} />
        </IconButton>
      </>
    );
  };

  return (
    <Fade in>
      <TableRow>
        <TableCell>{`名称: ${file.name}`}</TableCell>
        <TableCell>{`大小: ${sizeFmt(file.size)}`}</TableCell>
        <TableCell sx={{ padding: "unset", minWidth: "9rem" }}>
          <Stack flexDirection={"row"} alignItems={"center"}>
            <Typography mr={1}>状态:</Typography>
            {renderStatus()}
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
