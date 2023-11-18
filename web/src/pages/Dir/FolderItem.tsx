import { FC } from "react";

import Folder from "./Folder.tsx";
import File from "./File.tsx";

interface Props extends Dir.Info {
  path: string;
}

const FolderItem: FC<Props> = ({ path, name, is_dir, size = 0 }) => {
  if (is_dir) {
    return <Folder path={path} name={name} />;
  } else {
    return <File path={path} name={name} size={size} />;
  }
};
export default FolderItem;
