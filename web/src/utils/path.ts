export function parsePath(path: string): string[] {
  return path.split("/").filter(Boolean);
}

export function joinPath(...segments: string[]): string {
  return segments.flatMap(parsePath).join("/");
}

export function getParentPath(path: string): string {
  return parsePath(path).slice(0, -1).join("/");
}
