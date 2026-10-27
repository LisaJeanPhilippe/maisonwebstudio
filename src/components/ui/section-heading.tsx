import type { ReactNode } from "react";
import { Reveal } from "./reveal";

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  action,
  align = "left",
}: {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  align?: "left" | "center";
}) {
  const centered = align === "center";
  return (
    <Reveal
      className={`flex flex-col gap-8 md:flex-row md:items-end md:justify-between ${centered ? "items-center text-center md:flex-col md:items-center" : ""}`}
    >
      <div className={centered ? "mx-auto max-w-3xl" : "max-w-3xl"}>
        <p className="eyebrow mb-6">{eyebrow}</p>
        <h2 id={id} className="text-headline font-medium text-balance">{title}</h2>
        {description && <p className="mt-6 max-w-xl text-lede text-muted text-pretty">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </Reveal>
  );
}
