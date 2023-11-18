import { FC } from "react";

import Folder from "./Folder.tsx";
import File from "./File.tsx";

interface Props extends Dir.Info {
  path: string;

  parentFolderExpand?: boolean;
}

const FolderItem: FC<Props> = ({ is_dir, ...reset }) => {
  if (is_dir) {
    return <Folder {...reset} />;
  } else {
    return <File {...reset} />;
  }
};
export default FolderItem;
