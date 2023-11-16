import { FC, useState, useRef, useMemo, DragEvent } from "react";

import Item from "./Item.tsx";
import { Stack, Typography, Paper, Table, TableBody } from "@mui/material";
import { UploadFile } from "@mui/icons-material";

export const Upload: FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const onBrowserFile = () => {
    if (inputRef.current?.files && inputRef.current.files.length > 0) {
      const fileList = [...inputRef.current.files];
      setFiles((rawFiles) => [...rawFiles, ...fileList]);
      inputRef.current.value = "";
    }
  };
  const onDrag = (ev: DragEvent) => {
    if (ev.dataTransfer?.items) {
      let files: Array<File> = [];
      [...ev.dataTransfer.items].forEach((item) => {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      });
      if (files.length > 0) setFiles((rawFiles) => [...rawFiles, ...files]);
    }
  };

  const items = useMemo(
    () => files.map((file, i) => <Item key={i} file={file} />),
    [files],
  );

  return (
    <Stack>
      <Stack
        width={"100%"}
        alignItems={"center"}
        py={9}
        component={Paper}
        elevation={1}
        onClick={() => inputRef.current?.click()}
        onDrop={(e) => {
          e.preventDefault();
          onDrag(e);
          setDragActive(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        sx={{
          transition: "border-color ease-out .1s",
          borderColor: dragActive ? "info.main" : "transparent",
          borderStyle: "dotted",
        }}
      >
        <UploadFile color={"primary"} sx={{ fontSize: "4rem" }} />
        <Typography mt={1.5}>点击上传或将文件拖拽到此区域</Typography>
        <input
          ref={inputRef}
          type={"file"}
          multiple
          style={{ display: "none" }}
          onChange={onBrowserFile}
        />
      </Stack>

      <Table>
        <TableBody>{items}</TableBody>
      </Table>
    </Stack>
  );
};
export default Upload;
