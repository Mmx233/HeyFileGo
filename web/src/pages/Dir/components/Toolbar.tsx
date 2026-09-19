import { Fragment, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  FileArchive,
  FolderOpen,
  Grid2X2,
  List,
  MoreHorizontal,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { parsePath } from "@/utils/path";
import type { ViewMode } from "@/hooks/usePreferences";
import type { DirectoryLocation, SortBy } from "../location";

interface ToolbarProps {
  location: DirectoryLocation;
  viewMode: ViewMode;
  busy: boolean;
  refreshing: boolean;
  navigate: (path: string) => void;
  href: (path: string) => string;
  update: (patch: Partial<DirectoryLocation>) => void;
  setViewMode: (mode: ViewMode) => void;
  refresh: () => void;
  downloadDirectory: () => void;
}

export default function Toolbar({
  location,
  viewMode,
  busy,
  refreshing,
  navigate,
  href,
  update,
  setViewMode,
  refresh,
  downloadDirectory,
}: ToolbarProps) {
  const searchScope = JSON.stringify([location.path, location.query]);
  const [draft, setDraft] = useState({
    scope: searchScope,
    value: location.query,
  });
  if (draft.scope !== searchScope)
    setDraft({ scope: searchScope, value: location.query });
  const search = draft.scope === searchScope ? draft.value : location.query;
  const setSearch = (value: string) => setDraft({ scope: searchScope, value });
  const searchInput = useRef<HTMLInputElement>(null);
  const segments = parsePath(location.path);
  const visibleStart = Math.max(0, segments.length - 2);
  return (
    <div className="space-y-5">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <nav aria-label="Directory path" className="min-w-0 flex-1">
          <ol className="flex min-w-0 items-center gap-1 text-sm">
            <li className="shrink-0">
              <a
                href={href("")}
                onClick={(event) => {
                  event.preventDefault();
                  navigate("");
                }}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-current={!segments.length ? "page" : undefined}
              >
                <FolderOpen className="size-4" />{" "}
                <span className="hidden sm:inline">All files</span>
                <span className="sr-only sm:hidden">All files</span>
              </a>
            </li>
            {visibleStart > 0 && (
              <li className="flex shrink-0 items-center gap-1">
                <ChevronRight className="size-3.5 text-muted-foreground" />
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Show parent folders"
                      />
                    }
                  >
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {segments.slice(0, visibleStart).map((segment, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={() =>
                          navigate(segments.slice(0, index + 1).join("/"))
                        }
                      >
                        {segment}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            )}
            {segments.slice(visibleStart).map((segment, offset) => {
              const index = visibleStart + offset;
              const path = segments.slice(0, index + 1).join("/");
              const current = index === segments.length - 1;
              return (
                <Fragment key={path}>
                  <li aria-hidden="true" className="shrink-0">
                    <ChevronRight className="size-3.5 text-muted-foreground" />
                  </li>
                  <li className="min-w-0">
                    <a
                      href={href(path)}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(path);
                      }}
                      aria-current={current ? "page" : undefined}
                      title={segment}
                      className={`block max-w-56 truncate rounded-md px-2 py-1.5 hover:bg-muted ${current ? "font-medium" : "text-muted-foreground"}`}
                    >
                      {segment}
                    </a>
                  </li>
                </Fragment>
              );
            })}
          </ol>
        </nav>
        <Button variant="outline" onClick={downloadDirectory} disabled={busy}>
          <FileArchive /> Download folder as ZIP
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <form
          className="flex min-w-0 flex-1 gap-2 max-sm:basis-full"
          onSubmit={(event) => {
            event.preventDefault();
            update({ query: search, page: 1 });
          }}
          role="search"
          aria-label="Search this folder"
        >
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInput}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search this folder…"
              aria-label="Search filenames in this folder"
              className="pl-9 pr-9"
            />
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0.5 top-0.5 size-8"
                aria-label="Clear search"
                onClick={() => {
                  setSearch("");
                  searchInput.current?.focus();
                  update({ query: "", page: 1 });
                }}
              >
                <X className="size-3.5" />
              </Button>
            )}
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
        <Select
          value={location.sort}
          onValueChange={(value) => {
            if (value) update({ sort: value as SortBy, page: 1 });
          }}
        >
          <SelectTrigger aria-label="Sort files" className="w-36">
            <SelectValue>
              {
                { name: "Name", size: "Size", modified: "Modified" }[
                  location.sort
                ]
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="size">Size</SelectItem>
            <SelectItem value="modified">Modified</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          aria-label={
            location.order === "asc" ? "Sort descending" : "Sort ascending"
          }
          onClick={() =>
            update({
              order: location.order === "asc" ? "desc" : "asc",
              page: 1,
            })
          }
        >
          {location.order === "asc" ? <ArrowUp /> : <ArrowDown />}
        </Button>
        <div
          className="flex items-center rounded-lg border p-0.5"
          role="group"
          aria-label="File view"
        >
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="size-8"
            aria-label="List view"
            aria-pressed={viewMode === "list"}
            onClick={() => setViewMode("list")}
          >
            <List />
          </Button>
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="size-8"
            aria-label="Grid view"
            aria-pressed={viewMode === "grid"}
            onClick={() => setViewMode("grid")}
          >
            <Grid2X2 />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Refresh folder"
          onClick={refresh}
          disabled={refreshing}
        >
          <RefreshCw className={refreshing ? "animate-spin" : ""} />
        </Button>
      </div>
    </div>
  );
}
