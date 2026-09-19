import { lazy } from "react";
import useSWR from "swr";
import { ArrowUpToLine, FileDown, FolderOpen } from "lucide-react";
import Suspense from "@/components/Suspense";
import LoadingFullContainer from "@/components/LoadingFullContainer";
import ErrorState from "@/components/ErrorState";
import ErrorBoundary from "@/components/ErrorBoundary";
import api, { getErrorMessage } from "@/network/api";

const Upload = lazy(() => import("./pages/Upload"));
const File = lazy(() => import("./pages/File"));
const Dir = lazy(() => import("./pages/Dir"));
interface ServerInfo {
  mode: "upload" | "file" | "dir";
  name: string;
  upload_concurrency: number;
}
async function loadServerInfo(): Promise<ServerInfo> {
  const { data } = await api.get<ApiResponse<ServerInfo>>("info");
  if (!["upload", "file", "dir"].includes(data.data.mode))
    throw new Error("Unknown sharing mode");
  return data.data;
}
const modes = {
  upload: { label: "Receive files", icon: ArrowUpToLine },
  file: { label: "Shared file", icon: FileDown },
  dir: { label: "Shared folder", icon: FolderOpen },
};
export default function App() {
  const { data, error, mutate } = useSWR("server-info", loadServerInfo, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });
  const mode = data ? modes[data.mode] : null;
  const ModeIcon = mode?.icon;
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        className="sr-only fixed left-4 top-3 z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only"
        href="#main-content"
      >
        Skip to content
      </a>
      <header className="border-b bg-card/80">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
          <a
            href="/"
            className="flex items-center gap-3 rounded-md outline-offset-4"
            aria-label="HeyFileGo home"
          >
            <img src="/logo.svg" className="size-9 rounded-xl" alt="" />
            <span className="text-lg font-semibold tracking-tight">
              HeyFileGo
            </span>
          </a>
          {mode && ModeIcon && (
            <span className="flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <ModeIcon className="size-3.5" aria-hidden="true" />
              {mode.label}
            </span>
          )}
        </div>
      </header>
      <ErrorBoundary>
        {error ? (
          <main id="main-content" className="mx-auto w-full max-w-3xl p-6">
            <ErrorState
              message={getErrorMessage(error)}
              onRetry={() => void mutate()}
            />
          </main>
        ) : !data ? (
          <LoadingFullContainer />
        ) : (
          <Suspense>
            {data.mode === "dir" ? (
              <Dir name={data.name} />
            ) : data.mode === "file" ? (
              <File />
            ) : (
              <Upload name={data.name} concurrency={data.upload_concurrency} />
            )}
          </Suspense>
        )}
      </ErrorBoundary>
      <footer className="mx-auto w-full max-w-7xl px-4 py-5 text-xs text-muted-foreground sm:px-8">
        HeyFileGo · Simple file sharing
      </footer>
    </div>
  );
}
