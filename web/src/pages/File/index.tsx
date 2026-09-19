import { createElement, useEffect, useRef } from "react";
import useSWR from "swr";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PageShell from "@/components/PageShell";
import ErrorState from "@/components/ErrorState";
import { getFileIcon } from "@/utils/fileIcon";
import { sizeFmt } from "@/utils/fmt";
import api, { getErrorMessage } from "@/network/api";
async function loadFile() {
  return (await api.get<ApiResponse<File.Info>>("file/info")).data.data;
}
export default function FilePage() {
  const { data, error, mutate } = useSWR("shared-file", loadFile, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });
  const link = useRef<HTMLAnchorElement>(null);
  const started = useRef(false);
  useEffect(() => {
    if (data && !started.current) {
      started.current = true;
      link.current?.click();
    }
  }, [data]);
  return (
    <PageShell
      title="Shared file"
      description="Download a file from this device."
    >
      {error ? (
        <ErrorState
          message={getErrorMessage(error)}
          onRetry={() => void mutate()}
        />
      ) : (
        <section className="mx-auto my-4 flex w-full max-w-xl flex-col items-center rounded-2xl border bg-card px-6 py-12 text-center shadow-sm sm:my-10 sm:p-14">
          <div className="mb-7 rounded-2xl border border-primary/10 bg-primary/5 p-6 text-primary">
            {createElement(getFileIcon(data?.name ?? ""), {
              className: "size-14",
              strokeWidth: 1.4,
            })}
          </div>
          {data ? (
            <>
              <h2 className="w-full break-words text-xl font-semibold tracking-tight">
                {data.name}
              </h2>
              <p className="mt-2 text-sm tabular-nums text-muted-foreground">
                {sizeFmt(data.size)}
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-16" />
            </div>
          )}
          <Button
            size="lg"
            className="mt-8"
            disabled={!data}
            onClick={() => link.current?.click()}
          >
            <Download />
            Download file
          </Button>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Your download starts automatically.
            <br />
            Use the button if it hasn't started.
          </p>
          <a
            ref={link}
            href="/api/file/"
            download={data?.name}
            hidden
            aria-hidden="true"
          />
        </section>
      )}
    </PageShell>
  );
}
