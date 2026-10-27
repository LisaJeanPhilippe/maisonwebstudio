"use client";

import { AnimatePresence, motion } from "motion/react";
import { computeTotals, getPackage } from "@/lib/catalog";
import { useI18n } from "@/i18n/client";
import { fmt, formatPrice } from "@/i18n/format";
import type { Draft } from "./draft";
import { lineItemName } from "./line-items";

export function OrderSummary({ draft }: { draft: Draft }) {
  const { locale, m } = useI18n();
  const s = m.configurator.summary;
  const pkg = getPackage(draft.packageId);

  if (!pkg) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-line-strong p-7 text-[14.5px] text-muted">
        {s.choosePackage}
      </div>
    );
  }

  const { items, total } = computeTotals(pkg.id, draft.addOns);
  const copy = m.packages[pkg.id];

  return (
    <section aria-label={s.label} className="rounded-[var(--radius-lg)] border border-line bg-surface p-7">
      <p className="eyebrow">{s.eyebrow}</p>
      <p className="mt-4 text-[1.375rem] font-medium tracking-[-0.03em]">{copy.name}</p>
      <p className="mt-1 text-[13.5px] text-muted">
        {fmt(s.timeline, { timeline: draft.addOns.rush ? copy.rushTimeline : copy.timeline })}
      </p>

      <ul className="mt-6 space-y-3 border-t border-line pt-6 text-[14px]">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-between gap-4 overflow-hidden"
            >
              <span className="text-ink-soft">{lineItemName(locale, m, item)}</span>
              <span className="shrink-0">{formatPrice(locale, item.total)}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <div className="mt-6 border-t border-line pt-6">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-[14px] text-muted">{s.totalPaid}</span>
          <span className="text-[1.75rem] font-medium tracking-[-0.04em]">{formatPrice(locale, total)}</span>
        </div>
      </div>

      {draft.pages.length > 0 && (
        <div className="mt-6 border-t border-line pt-6">
          <p className="text-[13px] text-muted">{fmt(s.pages, { count: draft.pages.length })}</p>
          <p className="mt-2 text-[14px] leading-relaxed">{draft.pages.join(" · ")}</p>
        </div>
      )}
    </section>
  );
}
