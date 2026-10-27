import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 16, ...props }: IconProps, directional = false) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
    ...props,
    // Directional arrows mirror in right-to-left languages.
    className: `${directional ? "rtl:-scale-x-100 " : ""}${props.className ?? ""}`,
  };
}

export const ArrowRight = (p: IconProps) => (
  <svg {...base(p, true)}><path d="M3 8h10M9 4l4 4-4 4" /></svg>
);
export const ArrowUpRight = (p: IconProps) => (
  <svg {...base(p, true)}><path d="M5 11l6-6M6 5h5v5" /></svg>
);
export const ArrowLeft = (p: IconProps) => (
  <svg {...base(p, true)}><path d="M13 8H3M7 4L3 8l4 4" /></svg>
);
export const Check = (p: IconProps) => (
  <svg {...base(p)}><path d="M3.5 8.5l3 3 6-7" /></svg>
);
export const Minus = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 8h8" /></svg>
);
export const Plus = (p: IconProps) => (
  <svg {...base(p)}><path d="M8 3.5v9M3.5 8h9" /></svg>
);
export const Close = (p: IconProps) => (
  <svg {...base(p)}><path d="M4 4l8 8M12 4l-8 8" /></svg>
);
export const Upload = (p: IconProps) => (
  <svg {...base(p)}><path d="M8 11V3M4.5 6.5L8 3l3.5 3.5M3 13h10" /></svg>
);
export const FileIcon = (p: IconProps) => (
  <svg {...base(p)}><path d="M9 2H4.5A1.5 1.5 0 003 3.5v9A1.5 1.5 0 004.5 14h7a1.5 1.5 0 001.5-1.5V6L9 2z" /><path d="M9 2v4h4" /></svg>
);
export const Lock = (p: IconProps) => (
  <svg {...base(p)}><rect x="3.5" y="7" width="9" height="6.5" rx="1.5" /><path d="M5.5 7V5a2.5 2.5 0 015 0v2" /></svg>
);
