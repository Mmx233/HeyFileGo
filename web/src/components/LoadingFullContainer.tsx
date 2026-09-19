import { LoaderCircle } from "lucide-react";
export default function LoadingFullContainer() {
  return (
    <div
      id="main-content"
      className="flex min-h-64 flex-1 items-center justify-center gap-3 text-sm text-muted-foreground"
      role="status"
    >
      <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
      Loading…
    </div>
  );
}
