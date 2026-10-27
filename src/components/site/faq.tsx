import type { Messages } from "@/i18n/messages";
import { Plus } from "@/components/ui/icons";

export function FaqList({ m, headingLevel = 3 }: { m: Messages; headingLevel?: 2 | 3 }) {
  const Heading = `h${headingLevel}` as "h2" | "h3";
  return (
    <div className="border-t border-line">
      {m.faq.map((item) => (
        <details key={item.q} className="group border-b border-line">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
            <Heading className="text-[1.125rem] font-medium tracking-[-0.02em]">{item.q}</Heading>
            <span
              aria-hidden
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line-strong transition-transform duration-300 group-open:rotate-45"
            >
              <Plus />
            </span>
          </summary>
          <p className="max-w-2xl pb-7 text-[15.5px] leading-relaxed text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
