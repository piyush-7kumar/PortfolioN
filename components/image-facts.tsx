"use client";

import { useEffect, useState } from "react";

/** Real numbers about an image on the page: its rendered size or bytes transferred. */
export function ImageFacts({ targetId, show }: { targetId: string; show: "rendered" | "bytes" }) {
  const [text, setText] = useState("");

  useEffect(() => {
    const host = document.getElementById(targetId);
    if (!host) return;
    const image = () => (host instanceof HTMLImageElement ? host : host.querySelector("img"));

    const update = () => {
      if (show === "rendered") {
        const r = host.getBoundingClientRect();
        setText(`${Math.round(r.width)} × ${Math.round(r.height)}`);
        return;
      }
      const img = image();
      if (!img?.complete || !img.currentSrc) return;
      const entry = performance
        .getEntriesByType("resource")
        .find((e) => e.name === img.currentSrc) as PerformanceResourceTiming | undefined;
      const bytes = entry?.encodedBodySize || entry?.transferSize;
      const width = img.currentSrc.match(/[?&]w=(\d+)/)?.[1];
      if (bytes) setText(`${(bytes / 1024).toFixed(1)} KB over the wire${width ? `, ${width}px wide` : ""}`);
      else if (width) setText(`served at ${width}px wide`);
    };

    // Images load later than this effect runs; load events can be caught on the way down.
    const onLoad = () => update();
    host.addEventListener("load", onLoad, true);
    const ro = show === "rendered" ? new ResizeObserver(onLoad) : null;
    ro?.observe(host);
    if (show === "bytes") onLoad();
    return () => {
      host.removeEventListener("load", onLoad, true);
      ro?.disconnect();
    };
  }, [targetId, show]);

  return <span className="tk-d">{text}</span>;
}
