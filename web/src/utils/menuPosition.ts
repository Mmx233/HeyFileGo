/**
 * Calculate menu position to ensure it stays within viewport bounds
 */
export function calculateMenuPosition(
  clickX: number,
  clickY: number,
  viewportWidth: number,
  viewportHeight: number,
  menuWidth: number = 200,
  menuHeight: number = 150
): { x: number; y: number } {
  let x = clickX;
  let y = clickY;

  // Ensure menu doesn't overflow right edge
  if (x + menuWidth > viewportWidth) {
    x = Math.max(0, viewportWidth - menuWidth);
  }

  // Ensure menu doesn't overflow bottom edge
  if (y + menuHeight > viewportHeight) {
    y = Math.max(0, viewportHeight - menuHeight);
  }

  return { x, y };
}
