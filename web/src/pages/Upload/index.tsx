import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type DragEvent,
} from "react";
import { ArrowUpFromLine, Files, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import PageShell from "@/components/PageShell";
import api, { getErrorMessage } from "@/network/api";
import { UploadQueue } from "./queue";
import Item from "./Item";

export default function Upload({
  name,
  concurrency,
}: {
  name?: string;
  concurrency: number;
}) {
  const [queue] = useState(
    () =>
      new UploadQueue(
        concurrency,
        async (file, signal, onProgress) => {
          const form = new FormData();
          form.append("file", file);
          await api.post("upload", form, {
            signal,
            onUploadProgress: (event) =>
              onProgress(event.loaded, event.total ?? file.size),
          });
        },
        getErrorMessage,
      ),
  );
  const tasks = useSyncExternalStore(queue.subscribe, queue.getSnapshot);
  const [dragActive, setDragActive] = useState(false);
  const dragDepth = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    queue.resume();
    return () => queue.stop();
  }, [queue]);
  const completed = tasks.filter((task) => task.status === "success").length;
  const waiting = tasks.filter((task) => task.status === "queued").length;
  const active = tasks.filter((task) => task.status === "uploading").length;
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    dragDepth.current = 0;
    setDragActive(false);
    const items = Array.from(event.dataTransfer.items);
    if (items.some((item) => item.webkitGetAsEntry?.()?.isDirectory)) {
      toast.error("Folders cannot be uploaded. Choose individual files.");
      return;
    }
    queue.add(Array.from(event.dataTransfer.files));
  };
  return (
    <PageShell
      title="Send files"
      description={
        name
          ? `Files are received in ${name} on this device.`
          : "Choose files to send to this device."
      }
    >
      <section
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors sm:py-16 ${dragActive ? "border-primary bg-primary/5" : "border-border bg-card"}`}
        onDragEnter={(event) => {
          event.preventDefault();
          dragDepth.current++;
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (--dragDepth.current === 0) setDragActive(false);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
      >
        <div className="mb-5 rounded-2xl bg-primary/5 p-4 text-primary">
          <ArrowUpFromLine className="size-8" strokeWidth={1.5} />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">
          Drop your files here
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Or choose files from your device. Uploads start automatically.
        </p>
        <Button
          size="lg"
          className="mt-6 h-10 px-5"
          onClick={() => input.current?.click()}
        >
          <Plus />
          Choose files
        </Button>
        <input
          ref={input}
          className="sr-only"
          type="file"
          multiple
          tabIndex={-1}
          aria-label="Choose files to upload"
          onChange={(event) => {
            queue.add(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </section>
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-5">
          <div className="space-y-1">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Files className="size-4 text-muted-foreground" />
              Transfers
              {tasks.length > 0 && (
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                  {tasks.length}
                </span>
              )}
            </h2>
            <p className="text-xs text-muted-foreground" role="status">
              {tasks.length
                ? `${active} uploading · ${waiting} queued · ${completed} complete`
                : `Up to ${concurrency} files can be received at once.`}
            </p>
          </div>
          {completed > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => queue.clearCompleted()}
            >
              <Trash2 />
              Clear completed
            </Button>
          )}
        </div>
        {tasks.length ? (
          <ul className="divide-y">
            {tasks.map((task) => (
              <Item
                key={task.id}
                task={task}
                onCancel={() => queue.cancel(task.id)}
                onRetry={() => queue.retry(task.id)}
              />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <Files className="mb-1 size-7 text-muted-foreground/50" />
            <p className="text-sm font-medium">No transfers yet</p>
            <p className="text-xs text-muted-foreground">
              Your upload progress will appear here.
            </p>
          </div>
        )}
      </section>
    </PageShell>
  );
}
