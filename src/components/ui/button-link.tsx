import Link from "next/link";
import type { ComponentProps } from "react";
import { ArrowRight } from "./icons";

type Variant = "primary" | "secondary" | "ghost";

export function ButtonLink({
  variant = "primary",
  size = "md",
  arrow = false,
  className = "",
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: "sm" | "md"; arrow?: boolean }) {
  return (
    <Link
      className={`btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} group ${className}`}
      {...props}
    >
      {children}
      {arrow && (
        <ArrowRight className="transition-transform duration-300 ease-out-soft group-hover:translate-x-0.5" />
      )}
    </Link>
  );
}
