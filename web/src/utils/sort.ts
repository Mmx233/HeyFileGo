export type SortBy = 'name' | 'size';
export type SortOrder = 'asc' | 'desc';

/**
 * Sort items with folders always appearing before files
 * Within each group (folders/files), items are sorted by the specified criteria
 * 
 * @param items - Array of Dir.Info items to sort
 * @param sortBy - Sort criteria: 'name' or 'size'
 * @param sortOrder - Sort direction: 'asc' or 'desc'
 * @returns New sorted array (does not mutate original)
 */
export function sortItems(
  items: Dir.Info[],
  sortBy: SortBy,
  sortOrder: SortOrder
): Dir.Info[] {
  const sorted = [...items];
  
  sorted.sort((a, b) => {
    // Folders always come first
    if (a.is_dir && !b.is_dir) return -1;
    if (!a.is_dir && b.is_dir) return 1;
    
    // Within same type, sort by criteria
    let comparison: number;
    
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name, undefined, { 
        numeric: true, 
        sensitivity: 'base' 
      });
    } else {
      // Sort by size
      const sizeA = a.size ?? 0;
      const sizeB = b.size ?? 0;
      comparison = sizeA - sizeB;
    }
    
    // Apply sort order
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}
