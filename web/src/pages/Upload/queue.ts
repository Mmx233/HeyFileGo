export type UploadStatus =
  "queued" | "uploading" | "success" | "error" | "cancelled";

export interface UploadTask {
  id: string;
  file: File;
  status: UploadStatus;
  sent: number;
  total: number;
  speed: number;
  error?: string;
}

type SendFile = (
  file: File,
  signal: AbortSignal,
  progress: (sent: number, total: number) => void,
) => Promise<void>;

// The server owns the global limit; this queue avoids opening unnecessary requests.
export class UploadQueue {
  private tasks: UploadTask[] = [];
  private listeners = new Set<() => void>();
  private active = new Map<string, AbortController>();
  private stopped = false;
  private nextID = 0;
  private limit: number;
  private send: SendFile;
  private errorMessage: (error: unknown) => string;

  constructor(
    limit: number,
    send: SendFile,
    errorMessage: (error: unknown) => string,
  ) {
    this.limit = Math.max(1, limit);
    this.send = send;
    this.errorMessage = errorMessage;
  }

  getSnapshot = () => this.tasks;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private publish(tasks: UploadTask[]) {
    this.tasks = tasks;
    for (const listener of this.listeners) listener();
  }

  private update(id: string, change: Partial<UploadTask>) {
    this.publish(
      this.tasks.map((task) =>
        task.id === id ? { ...task, ...change } : task,
      ),
    );
  }

  add(files: File[]) {
    this.publish([
      ...this.tasks,
      ...files.map((file) => ({
        id: String(++this.nextID),
        file,
        status: "queued" as const,
        sent: 0,
        total: file.size,
        speed: 0,
      })),
    ]);
    this.pump();
  }

  cancel(id: string) {
    const task = this.tasks.find((task) => task.id === id);
    if (!task || (task.status !== "queued" && task.status !== "uploading"))
      return;
    this.update(id, { status: "cancelled", speed: 0 });
    this.active.get(id)?.abort();
    this.pump();
  }

  retry(id: string) {
    const task = this.tasks.find((task) => task.id === id);
    if (!task || (task.status !== "error" && task.status !== "cancelled"))
      return;
    this.update(id, {
      status: "queued",
      error: undefined,
      sent: 0,
      total: task.file.size,
      speed: 0,
    });
    this.pump();
  }

  clearCompleted() {
    this.publish(this.tasks.filter((task) => task.status !== "success"));
  }
  resume() {
    this.stopped = false;
    this.pump();
  }
  stop() {
    this.stopped = true;
    this.publish(
      this.tasks.map((task) =>
        task.status === "uploading"
          ? { ...task, status: "cancelled", speed: 0 }
          : task,
      ),
    );
    for (const controller of this.active.values()) controller.abort();
  }

  private pump() {
    if (this.stopped) return;
    while (this.active.size < this.limit) {
      const task = this.tasks.find(
        (task) => task.status === "queued" && !this.active.has(task.id),
      );
      if (!task) break;
      const controller = new AbortController();
      this.active.set(task.id, controller);
      this.update(task.id, { status: "uploading" });
      void this.run(task, controller);
    }
  }

  private async run(task: UploadTask, controller: AbortController) {
    const startedAt = Date.now();
    try {
      await this.send(task.file, controller.signal, (sent, total) => {
        if (controller.signal.aborted) return;
        this.update(task.id, {
          sent,
          total,
          speed: sent / Math.max(0.1, (Date.now() - startedAt) / 1000),
        });
      });
      if (!controller.signal.aborted)
        this.update(task.id, { status: "success", speed: 0 });
    } catch (error) {
      if (!controller.signal.aborted)
        this.update(task.id, {
          status: "error",
          error: this.errorMessage(error),
          speed: 0,
        });
    } finally {
      this.active.delete(task.id);
      this.pump();
    }
  }
}
