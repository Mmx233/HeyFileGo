import {
  useLayoutEffect,
  useRef,
  type Dispatch,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  FileArchive,
  FileDown,
  FolderOpen,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getFileIcon } from "@/utils/fileIcon";
import { sizeFmt } from "@/utils/fmt";
import { joinPath } from "@/utils/path";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { useSelectionBox } from "@/hooks/useSelectionBox";
import type {
  SelectionAction,
  SelectionState,
} from "@/context/fileBrowserReducer";
import type { DirectoryLocation, SortBy } from "../location";

interface FileBrowserProps {
  items: Dir.Info[];
  location: DirectoryLocation;
  viewMode: "grid" | "list";
  selection: SelectionState;
  dispatch: Dispatch<SelectionAction>;
  onOpen: (item: Dir.Info) => void;
  onDownload: (item: Dir.Info) => void;
  onDownloadSelection: () => void;
  onDownloadDirectory: () => void;
  onParent: () => void;
  onRefresh: () => void;
  onSort: (sort: SortBy) => void;
  href: (item: Dir.Info) => string;
  restoreFocusRef: RefObject<boolean>;
}

export default function FileBrowser({
  items,
  location,
  viewMode,
  selection,
  dispatch,
  onOpen,
  onDownload,
  onDownloadSelection,
  onDownloadDirectory,
  onParent,
  onRefresh,
  onSort,
  href,
  restoreFocusRef,
}: FileBrowserProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activationPointerType = useRef("mouse");
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (restoreFocusRef.current) {
      restoreFocusRef.current = false;
      if (!document.activeElement || document.activeElement === document.body) {
        container.focus({ preventScroll: true });
      }
    }
    return () => {
      // The next directory may load later; keep focus if the user moves elsewhere.
      if (container.contains(document.activeElement))
        restoreFocusRef.current = true;
    };
  }, [restoreFocusRef]);
  const openItem = (item: Dir.Info) => {
    // Menu items live in a portal, so their focus is outside the file container.
    if (item.is_dir) restoreFocusRef.current = true;
    onOpen(item);
  };
  const paths = items.map((item) => joinPath(location.path, item.name));
  const onKeyDown = useKeyboardNavigation({
    containerRef,
    paths,
    focused: selection.focused,
    dispatch,
    grid: viewMode === "grid",
    enabled: true,
    onOpen: (path) => {
      const item = items[paths.indexOf(path)];
      if (item) openItem(item);
    },
    onParent,
  });
  const { selectionBox, ...pointerHandlers } = useSelectionBox({
    containerRef,
    enabled: viewMode === "grid",
    onSelectionChange: (selected) =>
      dispatch({ type: "replace", paths: selected }),
  });
  const select = (path: string, event: MouseEvent<HTMLElement>) => {
    if (
      !event.currentTarget.contains(event.target as Node) ||
      (event.target as HTMLElement).closest("button, [role=checkbox]")
    )
      return;
    event.currentTarget.focus();
    dispatch({
      type: "click",
      path,
      toggle: event.ctrlKey || event.metaKey,
      range: event.shiftKey,
      page: paths,
    });
  };
  const openFromLink = (
    item: Dir.Info,
    event: MouseEvent<HTMLAnchorElement>,
  ) => {
    event.preventDefault();
    // Safari before 18.2 dispatches click as MouseEvent, without pointerType.
    const pointerType = activationPointerType.current;
    activationPointerType.current = "mouse";
    if (
      event.detail === 0 ||
      pointerType === "touch" ||
      pointerType === "pen"
    ) {
      event.stopPropagation();
      openItem(item);
    }
  };
  const actions = (item: Dir.Info, context: boolean): ReactNode => {
    const Item = context ? ContextMenuItem : DropdownMenuItem;
    const isMultiple =
      context &&
      selection.selected.has(joinPath(location.path, item.name)) &&
      selection.selected.size > 1;
    return (
      <>
        {item.is_dir && !isMultiple && (
          <Item onClick={() => openItem(item)}>
            <FolderOpen /> Open folder
          </Item>
        )}
        <Item
          onClick={() =>
            isMultiple ? onDownloadSelection() : onDownload(item)
          }
        >
          {isMultiple || item.is_dir ? <FileArchive /> : <FileDown />}
          {isMultiple
            ? `Download selection as ZIP (${selection.selected.size})`
            : item.is_dir
              ? "Download folder as ZIP"
              : "Download file"}
        </Item>
      </>
    );
  };
  const checkbox = (item: Dir.Info, path: string) => (
    <Checkbox
      checked={selection.selected.has(path)}
      aria-label={`Select ${item.name}`}
      onCheckedChange={() =>
        dispatch({ type: "click", path, toggle: true, page: paths })
      }
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    />
  );
  const menu = (item: Dir.Info) => (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground"
            aria-label={`Actions for ${item.name}`}
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={(event) => event.stopPropagation()}
          />
        }
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions(item, false)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
  const name = (item: Dir.Info, grid: boolean) => (
    <a
      href={href(item)}
      onPointerDown={(event) => {
        activationPointerType.current = event.pointerType;
      }}
      onPointerCancel={() => {
        activationPointerType.current = "mouse";
      }}
      onClick={(event) => openFromLink(item, event)}
      title={item.name}
      className={
        grid
          ? "line-clamp-2 break-all text-center text-sm font-medium leading-5 hover:underline"
          : "block truncate font-medium hover:underline"
      }
    >
      {item.name}
    </a>
  );
  const entryProps = (item: Dir.Info, path: string) => ({
    "data-entry": path,
    "data-selected": selection.selected.has(path),
    "aria-selected": selection.selected.has(path),
    tabIndex:
      selection.focused === path ||
      (!paths.includes(selection.focused || "") && path === paths[0])
        ? 0
        : -1,
    onClick: (event: MouseEvent<HTMLElement>) => select(path, event),
    onDoubleClick: (event: MouseEvent<HTMLElement>) => {
      if (
        event.currentTarget.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest("button, [role=checkbox]")
      )
        openItem(item);
    },
  });
  const sortHeading = (column: SortBy, label: string) => (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 font-normal text-muted-foreground"
      onClick={() => onSort(column)}
    >
      {label}
      {location.sort === column &&
        (location.order === "asc" ? (
          <ArrowUp className="size-3.5" />
        ) : (
          <ArrowDown className="size-3.5" />
        ))}
    </Button>
  );
  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div
            ref={containerRef}
            tabIndex={0}
            role="region"
            aria-label="Files. Use arrow keys to move, Enter to open, Space to select, and Control or Command A to select this page."
            className="relative min-h-64 select-none rounded-xl border bg-card outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onKeyDown={onKeyDown}
            onClick={(event) => {
              if (
                viewMode === "list" &&
                event.currentTarget.contains(event.target as Node) &&
                !(event.target as HTMLElement).closest(
                  "[data-entry], button, a, input, [role=checkbox]",
                )
              ) {
                dispatch({ type: "clear" });
                event.currentTarget.focus();
              }
            }}
            {...pointerHandlers}
          />
        }
      >
        {viewMode === "list" ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-11 pl-4">
                  <span className="sr-only">Select</span>
                </TableHead>
                <TableHead
                  aria-sort={
                    location.sort === "name"
                      ? location.order === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  {sortHeading("name", "Name")}
                </TableHead>
                <TableHead
                  className="hidden w-28 sm:table-cell"
                  aria-sort={
                    location.sort === "size"
                      ? location.order === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  {sortHeading("size", "Size")}
                </TableHead>
                <TableHead
                  className="hidden w-48 lg:table-cell"
                  aria-sort={
                    location.sort === "modified"
                      ? location.order === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  {sortHeading("modified", "Modified")}
                </TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => {
                const path = paths[index];
                const Icon = getFileIcon(item.name, item.is_dir);
                return (
                  <ContextMenu key={path}>
                    <ContextMenuTrigger
                      render={
                        <TableRow
                          {...entryProps(item, path)}
                          className="cursor-default outline-none data-[selected=true]:bg-primary/10 focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                        />
                      }
                    >
                      <TableCell className="pl-4">
                        {checkbox(item, path)}
                      </TableCell>
                      <TableCell className="max-w-0 py-3.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <Icon
                            className={`size-5 shrink-0 ${item.is_dir ? "text-primary" : "text-muted-foreground"}`}
                          />
                          <div className="min-w-0 flex-1">
                            {name(item, false)}
                            <div className="mt-0.5 text-xs text-muted-foreground sm:hidden">
                              {item.is_dir ? "Folder" : sizeFmt(item.size)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-sm tabular-nums text-muted-foreground sm:table-cell">
                        {item.is_dir ? "—" : sizeFmt(item.size)}
                      </TableCell>
                      <TableCell className="hidden text-sm tabular-nums text-muted-foreground lg:table-cell">
                        <time dateTime={item.modified_at}>
                          {new Date(item.modified_at).toLocaleString("en", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </time>
                      </TableCell>
                      <TableCell>{menu(item)}</TableCell>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      {actions(item, true)}
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div
            className="grid min-h-64 grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3 p-3 sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:gap-4 sm:p-4"
            role="grid"
            aria-label="Files"
            aria-multiselectable="true"
          >
            {items.map((item, index) => {
              const path = paths[index];
              const Icon = getFileIcon(item.name, item.is_dir);
              return (
                <ContextMenu key={path}>
                  <ContextMenuTrigger
                    render={
                      <div
                        {...entryProps(item, path)}
                        role="row"
                        className="relative flex min-h-44 min-w-0 flex-col rounded-lg border bg-background p-3 outline-none transition-colors hover:bg-muted/50 data-[selected=true]:border-primary/50 data-[selected=true]:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    }
                  >
                    <div role="gridcell" className="flex flex-1 flex-col">
                      <div className="flex items-center justify-between">
                        {checkbox(item, path)}
                        {menu(item)}
                      </div>
                      <Icon
                        className={`mx-auto my-4 size-10 shrink-0 ${item.is_dir ? "text-primary" : "text-muted-foreground"}`}
                      />
                      {name(item, true)}
                      <div className="mt-1.5 text-center text-xs text-muted-foreground">
                        {item.is_dir ? "Folder" : sizeFmt(item.size)}
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>{actions(item, true)}</ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>
        )}
        {selectionBox && (
          <div
            className="pointer-events-none absolute z-10 border border-primary bg-primary/15"
            style={{
              left: Math.min(selectionBox.startX, selectionBox.endX),
              top: Math.min(selectionBox.startY, selectionBox.endY),
              width: Math.abs(selectionBox.endX - selectionBox.startX),
              height: Math.abs(selectionBox.endY - selectionBox.startY),
            }}
          />
        )}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => dispatch({ type: "page", paths, checked: true })}
        >
          Select this page
        </ContextMenuItem>
        {selection.selected.size > 0 && (
          <ContextMenuItem onClick={onDownloadSelection}>
            {selection.selected.size === 1 &&
            selection.directories.size === 0 ? (
              <>
                <FileDown /> Download file
              </>
            ) : (
              <>
                <FileArchive /> Download selection as ZIP (
                {selection.selected.size})
              </>
            )}
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={onDownloadDirectory}>
          <FileArchive /> Download folder as ZIP
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onRefresh}>
          <RefreshCw /> Refresh
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
