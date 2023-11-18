import { FC, useEffect, useRef, useState } from "react";
import { sizeFmt } from "@/utils/fmt.ts";
import toast from "react-hot-toast";
import api from "@/network/api.ts";

import { Stack, Paper, Typography, Skeleton, Chip } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { FolderZip, FileDownload } from "@mui/icons-material";

const File: FC = () => {
  const [fileInfo, setFileInfo] = useState<File.Info | null>(null);
  const [disableDownload, setDisableDownload] = useState(false);

  const loadInfoConcurrent = useRef(false);
  const downloaderRef = useRef<HTMLAnchorElement | null>(null);

  const onLoadFileInfo = async () => {
    if (loadInfoConcurrent.current) return;
    loadInfoConcurrent.current = true;
    try {
      const {
        data: { data },
      } = await api.get<ApiResponse<File.Info>>("file/info");
      setFileInfo(data);
    } catch (err: any) {
      if (err.response?.data?.msg) toast.error(err.response.data.msg);
      else toast.error("载入文件信息失败，未知错误");
      setDisableDownload(true);
      setFileInfo({
        name: "--",
        size: 0,
      });
    }
  };
  const onDownload = () => {
    if (!fileInfo || disableDownload) return;
    downloaderRef.current?.click();
  };

   useEffect(() => {
    if (fileInfo) onDownload();
  }, [fileInfo]);
  useEffect(() => {
    onLoadFileInfo();
  }, []);

  return (
    <Stack
      component={Paper}
      elevation={1}
      height={"100vh"}
      width={"100vw"}
      justifyContent={"center"}
      alignItems={"center"}
    >
      <Stack alignItems={"center"}>
        <FolderZip sx={{ fontSize: "5.5rem" }} />

        <Typography variant={"h6"} my={1} px={2}>
          {fileInfo ? fileInfo.name : <Skeleton width={180} />}
        </Typography>
        {fileInfo ? (
          <Chip
            size={"small"}
            label={sizeFmt(fileInfo.size)}
            color={"secondary"}
          />
        ) : (
          <Skeleton variant={"rounded"} height={24} width={75} />
        )}

        <LoadingButton
          variant={"contained"}
          startIcon={<FileDownload />}
          sx={{ marginTop: "3rem" }}
          loading={!fileInfo}
          disabled={disableDownload}
          onClick={onDownload}
        >
          如果下载没有自动开始，点此重试
        </LoadingButton>
      </Stack>

      <a
        ref={downloaderRef}
        style={{ display: "none" }}
        href={fileInfo ? `/api/file/?${fileInfo.name}` : undefined}
        download={fileInfo?.name}
      />
    </Stack>
  );
};
export default File;
