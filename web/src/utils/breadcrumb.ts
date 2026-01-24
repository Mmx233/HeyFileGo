/**
 * Calculate which segments to show and which to collapse in breadcrumb
 */
export function calculateBreadcrumbDisplay(
  segments: string[],
  maxVisible: number
): { visible: string[]; collapsed: string[]; showEllipsis: boolean } {
  if (segments.length <= maxVisible) {
    return { visible: segments, collapsed: [], showEllipsis: false };
  }

  // Show first segment, ellipsis, and last (maxVisible - 2) segments
  const lastCount = maxVisible - 2;
  const collapsed = segments.slice(1, segments.length - lastCount);
  const visible = [
    segments[0],
    ...segments.slice(segments.length - lastCount),
  ];

  return { visible, collapsed, showEllipsis: true };
}
