import type { ComponentProps, CSSProperties } from "react";

type RevealProps = ComponentProps<"div"> & { delay?: number; y?: number };

/**
 * Soft fade-and-rise entrance as an element scrolls into view.
 * Pure CSS (scroll-driven animation, see `.reveal` in globals.css): content is
 * visible in the server HTML, so it never waits for JavaScript, and browsers
 * without scroll timelines or with reduced motion simply show it.
 */
export function Reveal({ delay = 0, y = 24, className = "", style, children, ...props }: RevealProps) {
  const vars = { "--enter-y": `${y}px`, "--reveal-offset": `${Math.round(delay * 400)}px`, ...style } as CSSProperties;
  return (
    <div className={`reveal ${className}`} style={vars} {...props}>
      {children}
    </div>
  );
}
