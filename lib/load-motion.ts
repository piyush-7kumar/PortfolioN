import type { ComponentType, ReactNode } from "react";

type Parts = {
  MotionMarker: ComponentType;
  MotionToast: ComponentType<{ id: number | null; children: ReactNode }>;
};

let parts: Promise<Parts> | null = null;

/** Load the Motion-powered parts once, when the browser is idle or when first needed. */
export function loadMotion(): Promise<Parts> {
  parts ??= import("@/components/motion-parts");
  return parts;
}

export function whenIdle(fn: () => void) {
  if ("requestIdleCallback" in window) requestIdleCallback(fn, { timeout: 2500 });
  else setTimeout(fn, 1200);
}
