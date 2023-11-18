import { memo, useRef } from "react";
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { InsertDriveFile } from "@mui/icons-material";
import { sizeFmt } from "@/utils/fmt.ts";

interface Props {
  name: string;
  path: string;
  size?: number;
}

export const File = memo<Props>(({ path, name, size = 0 }) => {
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
});
export default File;
