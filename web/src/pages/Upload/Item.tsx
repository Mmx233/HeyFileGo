import { createElement } from "react";
import {
  Check,
  CircleAlert,
  FileUp,
  LoaderCircle,
  RotateCcw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getFileIcon } from "@/utils/fileIcon";
import { sizeFmt } from "@/utils/fmt";
import type { UploadTask } from "./queue";

export default function Item({
  task,
  onCancel,
  onRetry,
}: {
  task: UploadTask;
  onCancel: () => void;
  onRetry: () => void;
}) {
  const active = task.status === "queued" || task.status === "uploading";
  const percent =
    task.total > 0
      ? Math.min(100, Math.round((task.sent / task.total) * 100))
      : 0;
  const status = {
    queued: "Queued",
    uploading: percent >= 100 ? "Waiting for device…" : "Uploading",
    success: "Uploaded",
    error: task.error ?? "Upload failed",
    cancelled: "Cancelled",
  }[task.status];
  return (
    <li className="flex items-start gap-3 p-4 sm:items-center sm:gap-4 sm:px-5">
      <div className="rounded-lg border bg-muted/50 p-2.5 text-muted-foreground">
        {createElement(getFileIcon(task.file.name), { className: "size-5" })}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline sm:gap-4">
          <span className="truncate text-sm font-medium" title={task.file.name}>
            {task.file.name}
          </span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {sizeFmt(task.file.size)}
          </span>
        </div>
        {task.status === "uploading" && (
          <Progress
            value={percent}
            aria-label={`Upload progress for ${task.file.name}`}
          />
        )}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
          <span
            className={`flex items-center gap-1.5 ${task.status === "error" ? "text-destructive" : task.status === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
          >
            {task.status === "success" ? (
              <Check className="size-3.5" />
            ) : task.status === "error" ? (
              <CircleAlert className="size-3.5" />
            ) : task.status === "uploading" ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : task.status === "queued" ? (
              <FileUp className="size-3.5" />
            ) : (
              <X className="size-3.5" />
            )}
            {status}
          </span>
          {task.status === "uploading" && (
            <span className="tabular-nums text-muted-foreground">
              {percent}%
              {percent < 100 && task.speed > 0
                ? ` · ${sizeFmt(task.speed, 1)}/s`
                : ""}
            </span>
          )}
        </div>
      </div>
      {active ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Cancel ${task.file.name}`}
          onClick={onCancel}
        >
          <X />
        </Button>
      ) : task.status !== "success" ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Retry ${task.file.name}`}
          onClick={onRetry}
        >
          <RotateCcw />
        </Button>
      ) : (
        <div className="w-8" />
      )}
    </li>
  );
}
