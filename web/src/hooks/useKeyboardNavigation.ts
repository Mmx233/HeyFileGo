import type { Dispatch, KeyboardEvent, RefObject } from "react";
import type { SelectionAction } from "@/context/fileBrowserReducer";

export function useKeyboardNavigation({
  containerRef,
  paths,
  focused,
  dispatch,
  onOpen,
  onParent,
  grid,
  enabled,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  paths: string[];
  focused: string | null;
  dispatch: Dispatch<SelectionAction>;
  onOpen: (path: string) => void;
  onParent: () => void;
  grid: boolean;
  enabled: boolean;
}) {
  return (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      !enabled ||
      !event.currentTarget.contains(event.target as Node) ||
      (event.target as HTMLElement).closest(
        "input, textarea, select, [role=menuitem], [contenteditable=true]",
      )
    )
      return;
    const elements = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>("[data-entry]") || [],
    );
    const activePath =
      (event.target as HTMLElement).closest<HTMLElement>("[data-entry]")
        ?.dataset.entry || focused;
    const current = activePath ? paths.indexOf(activePath) : -1;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a") {
      event.preventDefault();
      dispatch({ type: "page", paths, checked: true });
      return;
    }
    if ((event.target as HTMLElement).closest("button, a, [role=checkbox]"))
      return;
    if (event.key === "Escape") {
      event.preventDefault();
      dispatch({ type: "clear" });
      containerRef.current?.focus();
      return;
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      onParent();
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && activePath) {
      event.preventDefault();
      if (event.key === "Enter") onOpen(activePath);
      else
        dispatch({
          type: "click",
          path: activePath,
          toggle: true,
          page: paths,
        });
      return;
    }
    if (
      !paths.length ||
      ![
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
      ].includes(event.key)
    )
      return;
    if (!grid && ["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const columns =
      grid && elements.length
        ? elements.filter(
            (element) =>
              Math.abs(
                element.getBoundingClientRect().top -
                  elements[0].getBoundingClientRect().top,
              ) < 2,
          ).length
        : 1;
    let next = current < 0 ? 0 : current;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = paths.length - 1;
    else if (current >= 0)
      next +=
        event.key === "ArrowDown"
          ? columns
          : event.key === "ArrowUp"
            ? -columns
            : event.key === "ArrowRight"
              ? 1
              : -1;
    next = Math.max(0, Math.min(paths.length - 1, next));
    const path = paths[next];
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey)
      dispatch({ type: "focus", path });
    else
      dispatch({
        type: "click",
        path,
        range: event.shiftKey,
        toggle: event.ctrlKey || event.metaKey,
        page: paths,
      });
    elements[next]?.focus();
    elements[next]?.scrollIntoView({ block: "nearest" });
  };
}
