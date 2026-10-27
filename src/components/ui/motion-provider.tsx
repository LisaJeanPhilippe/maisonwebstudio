"use client";

import { MotionConfig } from "motion/react";

/** Respects the visitor's reduced-motion setting for every Motion animation. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
