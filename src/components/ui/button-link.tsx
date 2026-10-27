"use client";

import type { ComponentProps } from "react";
import { LocaleLink } from "@/i18n/client";
import { ArrowRight } from "./icons";

type Variant = "primary" | "secondary" | "ghost";

export function ButtonLink({
  variant = "primary",
  size = "md",
  arrow = false,
  className = "",
  children,
  ...props
}: ComponentProps<typeof LocaleLink> & { variant?: Variant; size?: "sm" | "md"; arrow?: boolean }) {
  return (
    <LocaleLink className={`btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} group ${className}`} {...props}>
      {children}
      {arrow && (
        <ArrowRight className="transition-transform duration-300 ease-out-soft group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
      )}
    </LocaleLink>
  );
}
