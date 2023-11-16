import { FC, useMemo } from "react";

import FolderItem from "./FolderItem.tsx";
import { Collapse, List } from "@mui/material";

interface Props {
  in?: boolean;
  pl?: number;
  path?: string;
  content: Dir.Info[];
  disableAnimation?: boolean;
}

const FolderView: FC<Props> = ({
  in: display = true,
  pl,
  path = "",
  content,
  disableAnimation,
}) => {
  const listItems = useMemo(
    () =>
      content.map((dir) => <FolderItem key={dir.name} path={path} {...dir} />),
    [content],
  );

  return (
    <Collapse in={display} enter={disableAnimation}>
      <List sx={{ pl }}>{listItems}</List>
    </Collapse>
  );
};
export default FolderView;
