import { FC, useRef } from "react";
import { sizeFmt } from "@/utils/fmt.ts";

import Folder from "./Folder.tsx";
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { InsertDriveFile } from "@mui/icons-material";

interface Props extends Dir.Info {
  path: string;
}

const FolderItem: FC<Props> = ({ path, name, is_dir, size = 0 }) => {
  if (is_dir) {
    return <Folder path={path} name={name} />;
  }

  const downloaderRef = useRef<HTMLAnchorElement | null>(null);

  return (
    <ListItemButton onClick={() => downloaderRef.current?.click()}>
      <ListItemIcon>
        <InsertDriveFile />
      </ListItemIcon>
      <ListItemText
        primary={name}
        secondary={size != 0 ? sizeFmt(size) : undefined}
      />
      <a
        ref={downloaderRef}
        style={{ display: "none" }}
        href={`/api/dir/file?${encodeURI(path + "/" + name)}`}
        download={name}
      />
    </ListItemButton>
  );
};
export default FolderItem;
