"use client";

import { useState } from "react";
import { cn, hostnameOf } from "@/lib/utils";

/** Site favicon with a lettered fallback when it can't be loaded. */
export function Favicon({ url, className }: { url: string; className?: string }) {
  const host = hostnameOf(url);
  const [failed, setFailed] = useState(false);
  if (failed || !host.includes("."))
    return (
      <span
        aria-hidden
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded bg-muted text-[10px] font-semibold text-muted-foreground uppercase",
          className,
        )}
      >
        {host.slice(0, 1)}
      </span>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`}
      alt=""
      width={20}
      height={20}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("size-5 shrink-0 rounded", className)}
    />
  );
}
