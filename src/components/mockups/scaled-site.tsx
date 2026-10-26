"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders children at a fixed design width (e.g. 1280px desktop / 390px phone)
 * and scales them down to fit the container, so sample sites look like real
 * screenshots at any size while staying crisp.
 */
export function ScaledSite({
  width,
  children,
  className = "",
  interactive = false,
}: {
  width: number;
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <div
        aria-hidden={!interactive}
        inert={!interactive}
        className="absolute left-0 top-0 origin-top-left transition-opacity duration-500"
        style={{
          width,
          transform: `scale(${scale ?? 1})`,
          opacity: scale === null ? 0 : 1,
          pointerEvents: interactive ? "auto" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
