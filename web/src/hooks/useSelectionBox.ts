import { useRef, useState, type PointerEvent, type RefObject } from "react";

interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function useSelectionBox({
  containerRef,
  onSelectionChange,
  enabled,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  onSelectionChange: (paths: Set<string>) => void;
  enabled: boolean;
}) {
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const position = (event: PointerEvent) => {
    const container = containerRef.current!;
    const rect = container.getBoundingClientRect();
    return {
      x: event.clientX - rect.left + container.scrollLeft,
      y: event.clientY - rect.top + container.scrollTop,
    };
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (
      !enabled ||
      !event.currentTarget.contains(event.target as Node) ||
      event.pointerType !== "mouse" ||
      event.button !== 0 ||
      (event.target as HTMLElement).closest("[data-entry], button, a, input")
    )
      return;
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    origin.current = position(event);
    setSelectionBox(null);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!origin.current || !enabled) return;
    const end = position(event);
    const box = {
      startX: origin.current.x,
      startY: origin.current.y,
      endX: end.x,
      endY: end.y,
    };
    if (
      Math.abs(box.endX - box.startX) < 4 &&
      Math.abs(box.endY - box.startY) < 4
    )
      return;
    setSelectionBox(box);
    const container = containerRef.current!;
    const rect = container.getBoundingClientRect();
    const paths = new Set<string>();
    container
      .querySelectorAll<HTMLElement>("[data-entry]")
      .forEach((element) => {
        const item = element.getBoundingClientRect();
        const left = item.left - rect.left + container.scrollLeft;
        const top = item.top - rect.top + container.scrollTop;
        if (
          left < Math.max(box.startX, box.endX) &&
          left + item.width > Math.min(box.startX, box.endX) &&
          top < Math.max(box.startY, box.endY) &&
          top + item.height > Math.min(box.startY, box.endY)
        ) {
          paths.add(element.dataset.entry!);
        }
      });
    onSelectionChange(paths);
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!origin.current) return;
    const end = position(event);
    if (
      Math.abs(end.x - origin.current.x) < 4 &&
      Math.abs(end.y - origin.current.y) < 4
    ) {
      onSelectionChange(new Set());
    }
    origin.current = null;
    setSelectionBox(null);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const onPointerCancel = () => {
    origin.current = null;
    setSelectionBox(null);
  };
  return {
    selectionBox,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };
}
