import { useState, useCallback, useRef, useEffect } from "react";

export interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface UseSelectionBoxOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  itemSelector: string;
  onSelectionChange: (selectedNames: Set<string>) => void;
  enabled?: boolean;
}

export function useSelectionBox(options: UseSelectionBoxOptions) {
  const { containerRef, itemSelector, onSelectionChange, enabled = true } = options;
  
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);

  const getRelativePosition = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left + containerRef.current.scrollLeft,
      y: e.clientY - rect.top + containerRef.current.scrollTop,
    };
  }, [containerRef]);

  const getItemsInBox = useCallback((box: SelectionBox): Set<string> => {
    if (!containerRef.current) return new Set();
    
    const items = containerRef.current.querySelectorAll(itemSelector);
    const selectedNames = new Set<string>();
    
    const boxLeft = Math.min(box.startX, box.endX);
    const boxRight = Math.max(box.startX, box.endX);
    const boxTop = Math.min(box.startY, box.endY);
    const boxBottom = Math.max(box.startY, box.endY);
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const itemLeft = rect.left - containerRect.left + containerRef.current!.scrollLeft;
      const itemRight = itemLeft + rect.width;
      const itemTop = rect.top - containerRect.top + containerRef.current!.scrollTop;
      const itemBottom = itemTop + rect.height;
      
      // Check if item intersects with selection box
      if (
        itemLeft < boxRight &&
        itemRight > boxLeft &&
        itemTop < boxBottom &&
        itemBottom > boxTop
      ) {
        const name = item.getAttribute("data-name");
        if (name) {
          selectedNames.add(name);
        }
      }
    });
    
    return selectedNames;
  }, [containerRef, itemSelector]);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!enabled || !containerRef.current) return;
    
    // Only start selection on left click and on the container itself
    if (e.button !== 0) return;
    
    // Don't start selection if clicking on an item
    const target = e.target as HTMLElement;
    if (target.closest(itemSelector)) return;
    
    const pos = getRelativePosition(e);
    startPointRef.current = pos;
    setIsSelecting(true);
    setSelectionBox({
      startX: pos.x,
      startY: pos.y,
      endX: pos.x,
      endY: pos.y,
    });
  }, [enabled, containerRef, itemSelector, getRelativePosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isSelecting || !startPointRef.current) return;
    
    const pos = getRelativePosition(e);
    const newBox = {
      startX: startPointRef.current.x,
      startY: startPointRef.current.y,
      endX: pos.x,
      endY: pos.y,
    };
    
    setSelectionBox(newBox);
    
    // Update selection in real-time
    const selectedNames = getItemsInBox(newBox);
    onSelectionChange(selectedNames);
  }, [isSelecting, getRelativePosition, getItemsInBox, onSelectionChange]);

  const handleMouseUp = useCallback(() => {
    if (!isSelecting) return;
    
    // If selection box is very small (just a click), clear selection
    if (selectionBox) {
      const width = Math.abs(selectionBox.endX - selectionBox.startX);
      const height = Math.abs(selectionBox.endY - selectionBox.startY);
      if (width < 5 && height < 5) {
        // This was just a click, not a drag - clear selection
        onSelectionChange(new Set());
      }
    }
    
    setIsSelecting(false);
    startPointRef.current = null;
    setSelectionBox(null);
  }, [isSelecting, selectionBox, onSelectionChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [enabled, containerRef, handleMouseDown, handleMouseMove, handleMouseUp]);

  return {
    isSelecting,
    selectionBox,
  };
}

export default useSelectionBox;
