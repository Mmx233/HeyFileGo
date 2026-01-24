/**
 * Parse a path string into an array of segments
 * @param path - The path string to parse (e.g., "/folder1/folder2/file.txt")
 * @returns Array of path segments (e.g., ["folder1", "folder2", "file.txt"])
 */
export function parsePath(path: string): string[] {
  if (!path || path === '/') {
    return [];
  }
  
  // Remove leading/trailing slashes and split
  const normalized = path.replace(/^\/+|\/+$/g, '');
  if (!normalized) {
    return [];
  }
  
  return normalized.split('/').filter(segment => segment.length > 0);
}

/**
 * Join path segments into a path string
 * @param segments - Path segments to join
 * @returns Joined path string with leading slash
 */
export function joinPath(...segments: string[]): string {
  const filtered = segments
    .flatMap(s => s.split('/'))
    .filter(s => s.length > 0);
  
  if (filtered.length === 0) {
    return '/';
  }
  
  return '/' + filtered.join('/');
}

/**
 * Get the parent path of a given path
 * @param path - The current path
 * @returns The parent path, or "/" for root
 */
export function getParentPath(path: string): string {
  const segments = parsePath(path);
  
  if (segments.length <= 1) {
    return '/';
  }
  
  return '/' + segments.slice(0, -1).join('/');
}
