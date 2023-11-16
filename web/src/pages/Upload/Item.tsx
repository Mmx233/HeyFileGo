import { FC, useEffect, useState, useRef } from "react";
import { api } from "@/network/api.ts";
import { sizeFmt } from "@/utils/fmt.ts";

import CircularProgressWithLabel from "./CircularProgressWithLabel.tsx";
import {
  TableRow,
  TableCell,
  Fade,
  Stack,
  Typography,
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
  const [uploadSpeed, setUploadSpeed] = useState(0);

  const abortController = useRef(new AbortController());
  const uploadConcurrent = useRef(false);
  const uploadStartAt = useRef(0);

  const onUpload = async () => {
    if (uploadConcurrent.current) return;
    uploadConcurrent.current = true;
    try {
      const form = new FormData();
      form.append("file", file);
      uploadStartAt.current = Date.now();
      await api.post("upload", form, {
        signal: abortController.current.signal,
        onUploadProgress: (ev) => {
          setProcess((ev.loaded / ev.total!) * 100);
          setUploadSpeed(
            ev.loaded / ((Date.now() - uploadStartAt.current) / 1000),
          );
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
      <Stack
        flexDirection={"row"}
        alignItems={"center"}
        flexGrow={1}
        justifyContent={"space-between"}
        boxSizing={"border-box"}
        pr={1}
        maxWidth={"15rem"}
      >
        <Stack flexDirection={"row"} alignItems={"center"}>
          <CircularProgressWithLabel size={30} value={process} color={"info"} />
          <Typography variant={"body2"} ml={1.5}>
            {uploadSpeed === 0 ? "--" : sizeFmt(uploadSpeed, 0) + "/s"}
          </Typography>
        </Stack>
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
      </Stack>
    );
  };

  return (
    <Fade in>
      <TableRow>
        <TableCell>{`名称: ${file.name}`}</TableCell>
        <TableCell>{`大小: ${sizeFmt(file.size)}`}</TableCell>
        <TableCell sx={{ padding: "unset", minWidth: "11.5rem" }}>
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
