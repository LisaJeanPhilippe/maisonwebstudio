import { FAQ } from "@/lib/content";
import { Plus } from "@/components/ui/icons";

export function FaqList() {
  return (
    <div className="border-t border-line">
      {FAQ.map((item) => (
        <details key={item.q} className="group border-b border-line">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[1.125rem] font-medium tracking-[-0.02em] [&::-webkit-details-marker]:hidden">
            {item.q}
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line-strong transition-transform duration-300 group-open:rotate-45">
              <Plus />
            </span>
          </summary>
          <p className="max-w-2xl pb-7 text-[15.5px] leading-relaxed text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
