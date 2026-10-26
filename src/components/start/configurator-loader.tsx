"use client";

import dynamic from "next/dynamic";

function Skeleton() {
  return (
    <div className="container-page pb-24 pt-8 md:pt-12" aria-busy="true" aria-label="Loading">
      <div className="mb-14 flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-24 animate-pulse rounded-full bg-line/70" />
        ))}
      </div>
      <div className="grid gap-16 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <div className="h-4 w-24 animate-pulse rounded bg-line/70" />
          <div className="h-12 w-3/4 animate-pulse rounded bg-line/70" />
          <div className="mt-10 h-40 animate-pulse rounded-2xl bg-line/50" />
          <div className="h-40 animate-pulse rounded-2xl bg-line/50" />
        </div>
        <div className="hidden h-80 animate-pulse rounded-3xl bg-line/50 lg:col-span-5 lg:block" />
      </div>
    </div>
  );
}

// Client-only: the configurator restores saved progress from localStorage.
export const ConfiguratorLoader = dynamic(() => import("./configurator"), {
  ssr: false,
  loading: Skeleton,
});

export function ClearSavedDraft() {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem("masion:configurator:v1");
    } catch {
      /* ignore */
    }
  }
  return null;
}
