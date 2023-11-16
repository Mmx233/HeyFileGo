import { FC, useEffect, useState } from "react";
import api from "@/network/api.ts";

import LoadingFullContainer from "@/components/LoadingFullContainer.tsx";
import FolderView from "./FolderView.tsx";
import { Box, Stack, Typography, Container } from "@mui/material";

const Dir: FC = () => {
  const [rootContent, setRootContent] = useState<Dir.Info[] | null>(null);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);

  const onLoadRootContent = async () => {
    try {
      const {
        data: { data },
      } = await api.get<ApiResponse<Dir.Info[]>>("dir/");
      setRootContent([
        ...data.filter((item) => item.is_dir),
        ...data.filter((item) => !item.is_dir),
      ]);
    } catch (err: any) {
      if (err.response?.data?.msg) setLoadError(err.response.data.msg);
      else setLoadError("未知错误，请刷新重试");
    }
  };

  useEffect(() => {
    onLoadRootContent();
  }, []);

  return (
    <Box sx={{ height: "100vh", width: "100vw", overflowY: "auto" }}>
      {rootContent === null ? (
        loadError ? (
          <Stack
            height={"100%"}
            width={"100%"}
            justifyContent={"center"}
            alignItems={"center"}
          >
            <Typography color={"error"}>{loadError}</Typography>
          </Stack>
        ) : (
          <LoadingFullContainer />
        )
      ) : (
        <Container sx={{py: 1.5}}>
          <FolderView content={rootContent} disableAnimation />
        </Container>
      )}
    </Box>
  );
};
export default Dir;
