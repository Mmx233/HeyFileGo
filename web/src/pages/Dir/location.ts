export type SortBy = "name" | "size" | "modified";
export type SortOrder = "asc" | "desc";

export interface DirectoryLocation {
  path: string;
  page: number;
  pageSize: number;
  sort: SortBy;
  order: SortOrder;
  query: string;
}

export function parseDirectoryLocation(
  search: string,
  defaults?: { sort: SortBy; order: SortOrder },
): DirectoryLocation {
  const params = new URLSearchParams(search);
  const page = Number(params.get("page") || 1);
  const pageSize = Number(params.get("page_size") || 100);
  const sort = params.get("sort") ?? defaults?.sort;
  return {
    path: (params.get("path") || "").split("/").filter(Boolean).join("/"),
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
    pageSize: [50, 100, 200].includes(pageSize) ? pageSize : 100,
    sort: sort === "size" || sort === "modified" ? sort : "name",
    order: (params.get("order") ?? defaults?.order) === "desc" ? "desc" : "asc",
    query: params.get("q") || "",
  };
}

export function directorySearch(
  search: string,
  patch: Partial<DirectoryLocation>,
): string {
  const next = { ...parseDirectoryLocation(search), ...patch };
  const params = new URLSearchParams(search);
  params.set("mode", "dir");
  params.set("path", next.path);
  params.set("page", String(next.page));
  params.set("page_size", String(next.pageSize));
  params.set("sort", next.sort);
  params.set("order", next.order);
  if (next.query) params.set("q", next.query);
  else params.delete("q");
  return `?${params}`;
}

export function directoryApi(location: DirectoryLocation): string {
  const params = new URLSearchParams({
    path: location.path,
    page: String(location.page),
    page_size: String(location.pageSize),
    sort: location.sort,
    order: location.order,
  });
  if (location.query) params.set("q", location.query);
  return `dir/${location.query ? "search" : "entries"}?${params}`;
}
