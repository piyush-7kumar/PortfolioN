"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

/**
 * Browsers without the View Transitions API get a crossfade instead of the
 * screenshot morph: the new page fades in over the old one's background.
 */
export function NavigationFade() {
  const pathname = usePathname();
  const first = useRef(true);

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const root = document.documentElement;
    if (typeof (document as { startViewTransition?: unknown }).startViewTransition === "function") return;
    root.dataset.navFade = "";
    const t = window.setTimeout(() => delete root.dataset.navFade, 400);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return null;
}
