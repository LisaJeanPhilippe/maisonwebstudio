"use client";

import { AnimatePresence, motion } from "motion/react";
import { computeTotals, estimatedTimeline, formatPrice, getPackage } from "@/lib/catalog";
import type { Draft } from "./draft";

export function OrderSummary({ draft }: { draft: Draft }) {
  const pkg = getPackage(draft.packageId);

  if (!pkg) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-line-strong p-7 text-[14.5px] text-muted">
        Choose a package to see your summary.
      </div>
    );
  }

  const { items, total } = computeTotals(pkg.id, draft.addOns);

  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-surface p-7">
      <p className="eyebrow">Your website</p>
      <p className="mt-4 text-[1.375rem] font-medium tracking-[-0.03em]">{pkg.name}</p>
      <p className="mt-1 text-[13.5px] text-muted">
        Estimated timeline: {estimatedTimeline(pkg.id, Boolean(draft.addOns.rush))}
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
              <span className="text-ink-soft">{item.name}</span>
              <span className="shrink-0">{formatPrice(item.total)}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <div className="mt-6 space-y-2 border-t border-line pt-6">
        <div className="flex items-baseline justify-between">
          <span className="text-[14px] text-muted">Total, paid in full</span>
          <motion.span
            key={total}
            initial={{ opacity: 0.4, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[1.75rem] font-medium tracking-[-0.04em]"
          >
            {formatPrice(total)}
          </motion.span>
        </div>
      </div>

      {draft.pages.length > 0 && (
        <div className="mt-6 border-t border-line pt-6">
          <p className="text-[13px] text-muted">Pages ({draft.pages.length})</p>
          <p className="mt-2 text-[14px] leading-relaxed">{draft.pages.join(" · ")}</p>
        </div>
      )}
    </div>
  );
}
