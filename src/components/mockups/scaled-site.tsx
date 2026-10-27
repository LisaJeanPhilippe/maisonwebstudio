"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders children at a fixed design width (e.g. 1280px desktop / 390px phone)
 * and scales them down to fit the container, so sample sites look like real
 * screenshots at any size while staying crisp.
 *
 * Sample sites are decorative here: they're hidden from assistive technology
 * (the caller provides a text alternative) and only rendered once they come
 * near the viewport, which keeps the initial page light.
 */
export function ScaledSite({
  width,
  children,
  className = "",
  eager = false,
}: {
  width: number;
  children: ReactNode;
  className?: string;
  eager?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  const [visible, setVisible] = useState(eager);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    let io: IntersectionObserver | undefined;
    if (!eager) {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            setVisible(true);
            io?.disconnect();
          }
        },
        { rootMargin: "600px 0px" },
      );
      io.observe(el);
    }
    return () => {
      ro.disconnect();
      io?.disconnect();
    };
  }, [width, eager]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`} aria-hidden>
      {visible && (
        <div
          inert
          lang="en"
          dir="ltr"
          className="pointer-events-none absolute left-0 top-0 origin-top-left transition-opacity duration-500"
          style={{ width, transform: `scale(${scale ?? 1})`, opacity: scale === null ? 0 : 1 }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
