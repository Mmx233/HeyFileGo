import { memo } from "react";

import Folder from "./Folder.tsx";
import File from "./File.tsx";

interface Props extends Dir.Info {
  path: string;
}

const FolderItem = memo<Props>(({ is_dir, ...reset }) => {
  if (is_dir) {
    return <Folder {...reset} />;
  } else {
    return <File {...reset} />;
  }
});
export default FolderItem;
