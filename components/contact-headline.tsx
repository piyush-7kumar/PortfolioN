"use client";

import { useEffect, useRef } from "react";

import { addFrameTask } from "./lens";

/**
 * "Tell me what you're building." Letters near the cursor widen and gain
 * weight through Mona Sans's variable axes, then settle back. Each letter is
 * locked to the width it has at rest, so the line never reflows.
 */
export function ContactHeadline({ id, text }: { id: string; text: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const h = ref.current;
    if (!h) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!matchMedia("(pointer: fine)").matches) return;

    const letters = Array.from(h.querySelectorAll<HTMLElement>(".magnify-letter"));
    const level = letters.map(() => 0);
    const shown = letters.map(() => 0);
    let widths: number[] = [];
    let offsets: { x: number; y: number }[] = [];
    let box: DOMRect | null = null;
    let ready = false;

    // Measure at rest (kerning included), then lock each letter's width.
    const lock = () => {
      delete h.dataset.fixed;
      letters.forEach((l) => {
        l.style.width = "";
        l.style.fontStretch = "";
        l.style.fontWeight = "";
        l.style.transform = "";
      });
      level.fill(0);
      shown.fill(0);
      const hb = h.getBoundingClientRect();
      const rects = letters.map((l) => l.getBoundingClientRect());
      widths = rects.map((r) => r.width);
      offsets = rects.map((r) => ({ x: r.left - hb.left + r.width / 2, y: r.top - hb.top + r.height / 2 }));
      letters.forEach((l, i) => (l.style.width = `${widths[i]}px`));
      h.dataset.fixed = "";
      ready = true;
    };

    let lastWidth = 0;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (Math.abs(w - lastWidth) < 0.5) return;
      lastWidth = w;
      ready = false;
      requestAnimationFrame(lock);
    });
    document.fonts.ready.then(() => ro.observe(h));

    const SIGMA = 72;
    const remove = addFrameTask({
      measure() {
        if (ready) box = h.getBoundingClientRect();
      },
      step(p, dt) {
        if (!ready || !box) return false;
        const near =
          p && p.x > box.left - 160 && p.x < box.right + 160 && p.y > box.top - 160 && p.y < box.bottom + 160;
        const k = 1 - Math.exp(-dt * 12);
        let moving = false;
        for (let i = 0; i < letters.length; i++) {
          let target = 0;
          if (near && p) {
            const dx = p.x - (box.left + offsets[i].x);
            const dy = (p.y - (box.top + offsets[i].y)) * 1.3;
            target = Math.exp(-(dx * dx + dy * dy) / (2 * SIGMA * SIGMA));
          }
          level[i] += (target - level[i]) * k;
          if (Math.abs(target - level[i]) < 0.004) level[i] = target;
          else moving = true;
          const v = Math.round(level[i] * 200) / 200;
          if (v === shown[i]) continue;
          shown[i] = v;
          const l = letters[i];
          if (v === 0) {
            l.style.fontStretch = "";
            l.style.fontWeight = "";
            l.style.transform = "";
          } else {
            l.style.fontStretch = `${(112 + 13 * v).toFixed(1)}%`;
            l.style.fontWeight = String(Math.round(650 + 150 * v));
            // Grow from the letter's center instead of its left edge.
            l.style.transform = `translateX(${(-widths[i] * 0.065 * v).toFixed(2)}px)`;
          }
        }
        return moving;
      },
    });

    return () => {
      remove();
      ro.disconnect();
    };
  }, []);

  const words = text.split(" ");
  return (
    <h2 ref={ref} id={id} tabIndex={-1} aria-label={text} className="t-display contact-headline">
      <span aria-hidden="true">
        {words.map((word, w) => (
          <span key={w}>
            <span className="magnify-word">
              {Array.from(word).map((ch, i) => (
                <span key={i} className="magnify-letter">
                  {ch}
                </span>
              ))}
            </span>
            {w < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    </h2>
  );
}
