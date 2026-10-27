import { DEMOS } from "@/components/demos";
import { BrowserFrame, PhoneFrame } from "@/components/mockups/frames";
import type { Project } from "@/lib/projects";

/**
 * Project presentation: the live sample site in a browser frame, set on the
 * project's own colour, with an optional phone view layered on top.
 */
export function ProjectMedia({
  project,
  label,
  variant = "wide",
  className = "",
}: {
  project: Project;
  /** Text alternative describing the preview, e.g. "Preview of the Aurelia Skin sample website". */
  label: string;
  variant?: "wide" | "tall" | "phones";
  className?: string;
}) {
  const Demo = DEMOS[project.slug];
  const tone = project.ink === "light" ? "dark" : "light";

  if (variant === "phones") {
    return (
      <div
        role="img"
        aria-label={label}
        className={`relative flex items-center justify-center gap-[6%] overflow-hidden rounded-[var(--radius-media)] px-[8%] py-[10%] ${className}`}
        style={{ background: project.surface }}
      >
        <PhoneFrame
          screenBg={project.screen}
          className="w-[42%] transition-transform duration-700 ease-out-soft group-hover:-translate-y-2"
        >
          <Demo />
        </PhoneFrame>
        <PhoneFrame
          screenBg={project.screen}
          className="mt-[16%] w-[42%] transition-transform duration-700 ease-out-soft group-hover:translate-y-1"
        >
          <div style={{ marginTop: -440 }}>
            <Demo />
          </div>
        </PhoneFrame>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={label}
      className={`relative overflow-hidden rounded-[var(--radius-media)] ${className}`}
      style={{ background: project.surface }}
    >
      <div
        className={`transition-transform duration-[900ms] ease-out-soft group-hover:scale-[1.015] ${
          variant === "tall" ? "px-[7%] pt-[9%]" : "px-[6%] pt-[6%] md:px-[9%] md:pt-[7%]"
        }`}
      >
        <BrowserFrame
          url={project.domain}
          tone={tone}
          aspect={variant === "tall" ? "aspect-[4/3.8]" : "aspect-[16/9.4]"}
          className="rounded-b-none border-b-0"
        >
          <Demo />
        </BrowserFrame>
      </div>
      {variant === "wide" && (
        <div className="absolute bottom-[-12%] end-[4%] hidden w-[17%] transition-transform duration-[900ms] ease-out-soft group-hover:-translate-y-3 md:block">
          <PhoneFrame screenBg={project.screen}>
            <Demo />
          </PhoneFrame>
        </div>
      )}
    </div>
  );
}
