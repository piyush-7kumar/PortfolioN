"use client";

import { useEffect } from "react";

/**
 * Writes the headline's real measurements into the hero's Source layer, so
 * the inspector tooltip and redlines show numbers from this viewport.
 */
export function HeroMeasure() {
  useEffect(() => {
    const h1 = document.getElementById("hero-title");
    const out = h1?.closest(".layered")?.querySelector<HTMLElement>(".layer-source");
    if (!h1 || !out) return;

    const px = (v: string) => Math.round(parseFloat(v) * 10) / 10;
    const measure = () => {
      const cs = getComputedStyle(h1);
      const { width, height } = h1.getBoundingClientRect();
      const pt = px(cs.paddingTop), pb = px(cs.paddingBottom);
      const values: Record<string, string> = {
        w: String(Math.round(width)),
        h: String(Math.round(height)),
        ch: String(Math.round(height - pt - pb)),
        fs: `${px(cs.fontSize)}px`,
        lh: `${px(cs.lineHeight)}px`,
        pt: String(Math.round(pt)),
        pb: String(Math.round(pb)),
        mb: String(Math.round(px(cs.marginBottom))),
      };
      out.querySelectorAll<HTMLElement>("[data-m]").forEach((el) => {
        const v = values[el.dataset.m!];
        if (v && el.textContent !== v) el.textContent = v;
      });
      out.dataset.measured = "";
    };

    let raf = 0;
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    document.fonts.ready.then(schedule);
    const ro = new ResizeObserver(schedule);
    ro.observe(h1);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
