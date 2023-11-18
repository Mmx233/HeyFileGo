import { memo, useEffect, useState, useTransition } from "react";
import api from "@/network/api.ts";
import toast from "react-hot-toast";

import FolderView from "@/pages/Dir/FolderView.tsx";
import {
  Collapse,
  LinearProgress,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  Folder as FolderIcon,
  FolderOpen,
} from "@mui/icons-material";

interface Props {
  path: string;
  name: string;

  parentFolderExpand?: boolean;
}

export const Folder = memo<Props>(({ path, name, parentFolderExpand }) => {
  const [, startTransition] = useTransition();

  const [expand, setExpand] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [content, setContent] = useState<Dir.Info[] | null>(null);

  const onLoadContent = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const {
        data: { data },
      } = await api.get<ApiResponse<Dir.Info[]>>(
        `dir/?${encodeURI(path + "/" + name)}`,
      );
      setContent([
        ...data.filter((item) => item.is_dir),
        ...data.filter((item) => !item.is_dir),
      ]);
    } catch (err: any) {
      if (err.response?.data?.msg) toast.error(err.response.data.msg);
      else toast.error("载入文件夹内容失败，未知错误");
      console.log(err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (content) setExpand(true);
  }, [content]);
  useEffect(() => {
    if (parentFolderExpand === false && expand) {
      startTransition(() => setExpand(false));
    }
  }, [parentFolderExpand]);

  return (
    <>
      <ListItemButton
        onClick={() => (content ? setExpand(!expand) : onLoadContent())}
      >
        <ListItemIcon>{expand ? <FolderOpen /> : <FolderIcon />}</ListItemIcon>
        <ListItemText primary={name} />
        {expand ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={isLoading}>
        <LinearProgress />
      </Collapse>
      {content ? (
        <FolderView
          in={expand}
          ml={3.3}
          border
          path={path + "/" + name}
          content={content}
          parentFolderExpand={expand}
        />
      ) : undefined}
    </>
  );
});
export default Folder;
