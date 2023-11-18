import { FC, useMemo } from "react";

import FolderItem from "./FolderItem.tsx";
import { Collapse, List } from "@mui/material";

interface Props {
  in?: boolean;
  ml?: number;
  border?: boolean;
  path?: string;
  content: Dir.Info[];
  disableAnimation?: boolean;
}

const FolderView: FC<Props> = ({
  in: display = true,
  ml,
  border,
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
      <List
        sx={{
          ml,
          boxSizing: "border-box",
          borderLeftStyle: border ? "dotted" : undefined,
          borderColor: 'grey.700'
        }}
      >
        {listItems}
      </List>
    </Collapse>
  );
};
export default FolderView;