import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import useSWR from "swr";
import {
  AlertCircle,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileArchive,
  FileDown,
  FolderOpen,
  SearchX,
  X,
} from "lucide-react";
import PageShell from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { savePreferences, usePreferences } from "@/hooks/usePreferences";
import { useSelection } from "@/hooks/useSelection";
import api, { getErrorMessage } from "@/network/api";
import { getParentPath, joinPath } from "@/utils/path";
import Toolbar from "./components/Toolbar";
import FileBrowser from "./components/FileBrowser";
import {
  directoryApi,
  directorySearch,
  parseDirectoryLocation,
  type DirectoryLocation,
  type SortBy,
} from "./location";

const subscribeLocation = (callback: () => void) => {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
};
const locationSnapshot = () => window.location.search;
const fetchDirectory = async (url: string) => {
  const { data } = await api.get<ApiResponse<Dir.Page>>(url);
  return data.data;
};

export default function Dir({ name }: { name?: string }) {
  const search = useSyncExternalStore(subscribeLocation, locationSnapshot);
  const { viewMode, setViewMode, initialSort, initialOrder } = usePreferences();
  const location = parseDirectoryLocation(search, {
    sort: initialSort,
    order: initialOrder,
  });
  const { data, error, isLoading, isValidating, mutate } = useSWR<Dir.Page>(
    directoryApi(location),
    fetchDirectory,
    { revalidateOnFocus: false },
  );
  useEffect(() => {
    savePreferences({
      viewMode,
      sortBy: location.sort,
      sortOrder: location.order,
    });
  }, [viewMode, location.sort, location.order]);
  const items = data?.items || [];
  const pagePaths = items.map((item) => joinPath(location.path, item.name));
  const selection = useSelection(
    JSON.stringify([location.path, location.query]),
    new Map(items.map((item, index) => [pagePaths[index], item.is_dir])),
  );
  const singleFileSelected =
    selection.selected.size === 1 && selection.directories.size === 0;
  const allPageSelected =
    pagePaths.length > 0 &&
    pagePaths.every((path) => selection.selected.has(path));
  const somePageSelected = pagePaths.some((path) =>
    selection.selected.has(path),
  );
  const downloadFrame = useRef<HTMLIFrameElement>(null);
  const restoreFileFocus = useRef(false);
  const downloadTarget = `download-${useId()}`;
  const [downloadNotice, setDownloadNotice] = useState<{
    error: boolean;
    message: string;
  } | null>(null);
  const busy = isLoading || !!error || !data;
  const totalPages = Math.max(
    1,
    Math.ceil((data?.total || 0) / location.pageSize),
  );
  const page = data?.page || location.page;

  const update = useCallback(
    (patch: Partial<DirectoryLocation>, replace = false) => {
      const url = directorySearch(window.location.search, {
        sort: location.sort,
        order: location.order,
        ...patch,
      });
      if (url === window.location.search) return;
      window.history[replace ? "replaceState" : "pushState"](null, "", url);
      window.dispatchEvent(new PopStateEvent("popstate"));
      if (!replace) window.scrollTo({ top: 0 });
    },
    [location.sort, location.order],
  );

  useEffect(() => {
    if (data && data.page !== location.page) update({ page: data.page }, true);
  }, [data, location.page, update]);

  const navigate = (path: string) => update({ path, query: "", page: 1 });
  const folderHref = (path: string) =>
    directorySearch(search, {
      sort: location.sort,
      order: location.order,
      path,
      query: "",
      page: 1,
    });
  const fileHref = (path: string) =>
    `/api/dir/file?${new URLSearchParams({ path })}`;
  const refresh = () => {
    void mutate().catch(() => undefined);
  };
  const downloadArchive = (paths: string[]) => {
    if (!paths.length) return;
    setDownloadNotice({
      error: false,
      message:
        "Your archive is being requested. Check your browser’s downloads for progress and completion.",
    });
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/dir/archive";
    form.target = downloadTarget;
    form.hidden = true;
    paths.forEach((path) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "path";
      input.value = path || ".";
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
    form.remove();
  };
  const downloadFile = (path: string) => {
    setDownloadNotice(null);
    const link = document.createElement("a");
    link.href = fileHref(path);
    link.target = downloadTarget;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  const downloadItem = (item: Dir.Info) => {
    const path = joinPath(location.path, item.name);
    if (item.is_dir) downloadArchive([path]);
    else downloadFile(path);
  };
  const open = (item: Dir.Info) =>
    item.is_dir
      ? navigate(joinPath(location.path, item.name))
      : downloadItem(item);
  const downloadSelection = () => {
    const paths = [...selection.selected];
    if (singleFileSelected) downloadFile(paths[0]);
    else downloadArchive(paths);
  };
  const downloadDirectory = () => downloadArchive([location.path]);
  const sort = (column: SortBy) =>
    update({
      sort: column,
      order:
        column === location.sort && location.order === "asc" ? "desc" : "asc",
      page: 1,
    });
  const inspectDownload = () => {
    try {
      const text =
        downloadFrame.current?.contentDocument?.body.textContent?.trim();
      if (!text) return;
      const result = JSON.parse(text) as { msg?: string; code?: number };
      setDownloadNotice({
        error: true,
        message:
          result.msg ||
          "The download could not start. Refresh the folder and try again.",
      });
    } catch {
      setDownloadNotice({
        error: true,
        message:
          "The download could not start. Check your browser’s downloads and try again.",
      });
    }
  };

  return (
    <PageShell
      title={name || "Shared files"}
      description="Browse the shared folder and download what you need."
    >
      <div className="space-y-5 pb-24">
        <Toolbar
          location={location}
          viewMode={viewMode}
          busy={busy}
          refreshing={isValidating}
          navigate={navigate}
          href={folderHref}
          update={update}
          setViewMode={setViewMode}
          refresh={refresh}
          downloadDirectory={downloadDirectory}
        />
        {downloadNotice && (
          <div
            role={downloadNotice.error ? "alert" : "status"}
            className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${downloadNotice.error ? "border-destructive/30 bg-destructive/5 text-destructive" : "bg-muted/40 text-muted-foreground"}`}
          >
            {downloadNotice.error ? (
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
            ) : (
              <FileArchive className="mt-0.5 size-4 shrink-0" />
            )}
            <p className="flex-1 pt-0.5">{downloadNotice.message}</p>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              aria-label="Dismiss download message"
              onClick={() => setDownloadNotice(null)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        )}
        <div className="flex min-h-6 flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <label className="flex cursor-pointer items-center gap-2.5">
            <Checkbox
              checked={allPageSelected}
              indeterminate={somePageSelected && !allPageSelected}
              disabled={busy || !items.length}
              onCheckedChange={(checked) =>
                selection.dispatch({ type: "page", paths: pagePaths, checked })
              }
            />{" "}
            Select this page
          </label>
          <p aria-live="polite">
            {busy
              ? ""
              : `${data.total.toLocaleString("en")} ${location.query ? "matches in this folder" : data.total === 1 ? "item" : "items"}`}
          </p>
        </div>
        {isLoading ? (
          <div
            className="space-y-4 rounded-xl border p-5"
            role="status"
            aria-label="Loading files"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <div className="flex items-center gap-4" key={index}>
                <Skeleton className="size-9 rounded-lg" />
                <Skeleton className={index % 2 ? "h-4 w-2/5" : "h-4 w-3/5"} />
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            className="flex flex-col items-center rounded-xl border border-destructive/20 py-16 text-center"
            role="alert"
          >
            <AlertCircle className="mb-4 size-9 text-destructive" />
            <h2 className="font-semibold">Couldn’t load this folder</h2>
            <p className="mt-2 max-w-xl break-words px-4 text-sm text-muted-foreground">
              {getErrorMessage(
                error,
                "The folder could not be loaded. Please try again.",
              )}
            </p>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={refresh}>
                Try again
              </Button>
              {location.path && (
                <Button
                  variant="secondary"
                  onClick={() => navigate(getParentPath(location.path))}
                >
                  Go to parent folder
                </Button>
              )}
            </div>
          </div>
        ) : !items.length ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed py-20 text-center">
            {location.query ? (
              <SearchX className="mb-4 size-10 text-muted-foreground" />
            ) : (
              <FolderOpen className="mb-4 size-10 text-muted-foreground" />
            )}
            <h2 className="font-semibold">
              {location.query
                ? "No matching filenames"
                : "This folder is empty"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {location.query
                ? "Search checks all items directly inside this folder."
                : "There are no files or folders here yet."}
            </p>
            {location.query ? (
              <Button
                className="mt-6"
                variant="outline"
                onClick={() => update({ query: "", page: 1 })}
              >
                Clear search
              </Button>
            ) : (
              location.path && (
                <Button
                  className="mt-6"
                  variant="outline"
                  onClick={() => navigate(getParentPath(location.path))}
                >
                  <ArrowUp /> Go to parent folder
                </Button>
              )
            )}
          </div>
        ) : (
          <FileBrowser
            key={JSON.stringify([
              location.path,
              location.query,
              page,
              location.sort,
              location.order,
              viewMode,
            ])}
            items={items}
            location={location}
            viewMode={viewMode}
            selection={selection}
            dispatch={selection.dispatch}
            restoreFocusRef={restoreFileFocus}
            onOpen={open}
            onDownload={downloadItem}
            onDownloadSelection={downloadSelection}
            onDownloadDirectory={downloadDirectory}
            onParent={() => navigate(getParentPath(location.path))}
            onRefresh={refresh}
            onSort={sort}
            href={(item) =>
              item.is_dir
                ? folderHref(joinPath(location.path, item.name))
                : fileHref(joinPath(location.path, item.name))
            }
          />
        )}
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>Items per page</span>
            <Select
              value={String(location.pageSize)}
              onValueChange={(value) => {
                if (value) update({ pageSize: Number(value), page: 1 });
              }}
            >
              <SelectTrigger aria-label="Items per page" className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[50, 100, 200].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <nav className="flex items-center gap-1" aria-label="File pages">
            <Button
              variant="outline"
              size="icon"
              aria-label="First page"
              disabled={busy || page <= 1}
              onClick={() => update({ page: 1 })}
            >
              <ChevronsLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous page"
              disabled={busy || page <= 1}
              onClick={() => update({ page: page - 1 })}
            >
              <ChevronLeft />
            </Button>
            <form
              key={page}
              className="mx-2 flex items-center gap-2 text-muted-foreground"
              onSubmit={(event) => {
                event.preventDefault();
                const target = Number(
                  new FormData(event.currentTarget).get("page"),
                );
                if (
                  Number.isInteger(target) &&
                  target > 0 &&
                  target <= totalPages
                )
                  update({ page: target });
              }}
            >
              <Input
                aria-label="Page number"
                name="page"
                type="number"
                min={1}
                max={totalPages}
                defaultValue={page}
                disabled={busy}
                className="w-16 px-1.5 text-center tabular-nums"
              />
              <span className="whitespace-nowrap">
                of {totalPages.toLocaleString("en")}
              </span>
            </form>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next page"
              disabled={busy || page >= totalPages}
              onClick={() => update({ page: page + 1 })}
            >
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Last page"
              disabled={busy || page >= totalPages}
              onClick={() => update({ page: totalPages })}
            >
              <ChevronsRight />
            </Button>
          </nav>
        </div>
        {selection.selected.size > 0 && (
          <div
            className="fixed inset-x-4 bottom-5 z-30 mx-auto flex max-w-[calc(100%-2rem)] flex-col gap-3 rounded-xl border bg-popover p-3 shadow-lg sm:w-fit sm:flex-row sm:items-center sm:gap-6 sm:pl-4"
            role="region"
            aria-label="Selected files"
          >
            <p className="text-sm font-medium tabular-nums" aria-live="polite">
              {selection.selected.size === 1
                ? singleFileSelected
                  ? "1 file selected"
                  : "1 folder selected"
                : `${selection.selected.size} items selected`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                className="flex-1 sm:flex-none"
                onClick={downloadSelection}
                disabled={busy}
              >
                {singleFileSelected ? <FileDown /> : <FileArchive />}
                {singleFileSelected ? "Download file" : "Download as ZIP"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Clear selection"
                onClick={() => selection.dispatch({ type: "clear" })}
              >
                <X />
              </Button>
            </div>
          </div>
        )}
      </div>
      <iframe
        ref={downloadFrame}
        name={downloadTarget}
        title="Download response"
        hidden
        onLoad={inspectDownload}
      />
    </PageShell>
  );
}
