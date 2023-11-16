import { FC, useState } from "react";
import { sizeFmt } from "@/utils/fmt.ts";

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
} from "@mui/icons-material";

interface Props {
  path: string;
  name: string;
}

export const Folder: FC<Props> = ({ path, name }) => {
  const [expand, setExpand] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [content, setContent] = useState<Dir.Info[] | null>(null);

  return (
    <>
      <ListItemButton>
        <ListItemIcon>
          <FolderIcon />
        </ListItemIcon>
        <ListItemText primary={name} />
        {expand ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={isLoading}>
        <LinearProgress />
      </Collapse>
      {content ? (
        <FolderView in={expand} path={path + "/" + name} content={content} />
      ) : undefined}
    </>
  );
};
export default Folder;
