"use client";

/*
 * The lens. One module, one requestAnimationFrame loop.
 *
 * Every block renders a Page layer and a Source layer in the same grid cell.
 * The Source layer is clipped with `circle(var(--r) at var(--x) var(--y))`.
 * This loop moves that circle for every visible layer, springs the glass that
 * follows the cursor, expands it to fill the screen for Source view, runs the
 * first-visit wipe and nudges the specular highlight on glass surfaces. It
 * stops whenever nothing is moving and pauses while the tab is hidden.
 */

import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

type Vec = { x: number; y: number };
export type View = "page" | "source";
/** Where a Source view transition starts: a point (the cursor) or the switch. */
export type Origin = Vec | "switch";

const EXPAND_MS = 600;
const INTRO_MS = 700;
const CURSOR_R = 100; // the cursor lens is 200px wide

const html = () => document.documentElement;

// cubic-bezier(0.2, 0.8, 0.2, 1), the site's only easing curve.
function ease(t: number): number {
  const x1 = 0.2, y1 = 0.8, x2 = 0.2, y2 = 1;
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  let u = t;
  for (let i = 0; i < 6; i++) {
    const x = ((ax * u + bx) * u + cx) * u - t;
    const d = (3 * ax * u + 2 * bx) * u + cx;
    if (Math.abs(x) < 1e-5 || d === 0) break;
    u -= x / d;
  }
  return ((ay * u + by) * u + cy) * u;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Work that runs inside the shared loop. `measure` reads, `step` writes. */
export type FrameTask = {
  measure?(): void;
  step(pointer: Vec | null, dt: number): boolean;
};

const tasks = new Set<FrameTask>();

export function addFrameTask(task: FrameTask) {
  tasks.add(task);
  wake();
  return () => {
    tasks.delete(task);
  };
}

const s = {
  started: false,
  view: "page" as View,
  mode: "rest" as "rest" | "pointer",
  pointer: null as Vec | null,
  inside: true,
  overLink: false,
  shift: false,
  lens: { x: 0, y: 0 },
  lensV: { x: 0, y: 0 },
  r: 0,
  rV: 0,
  anim: null as null | { kind: "expand" | "collapse"; origin: Vec; from: number; to: number; start: number },
  intro: null as null | { start: number },
  reduced: false,
  raf: 0,
  last: 0,
  dirty: false,
  lastApplied: -1,
  layers: [] as HTMLElement[],
  visible: new Set<HTMLElement>(),
  targets: [] as HTMLElement[],
  glasses: [] as { el: HTMLElement; light: HTMLElement }[],
  rest: null as HTMLElement | null,
  hero: null as HTMLElement | null,
  lensEl: null as HTMLElement | null,
  dotEl: null as HTMLElement | null,
  specEl: null as HTMLElement | null,
  io: null as IntersectionObserver | null,
  listeners: new Set<() => void>(),
};

/* ----------------------------------------------------------------------------
   Public API
---------------------------------------------------------------------------- */

export function getView(): View {
  return s.view;
}

function subscribe(fn: () => void) {
  s.listeners.add(fn);
  return () => s.listeners.delete(fn);
}

export function useView(): View {
  return useSyncExternalStore(subscribe, getView, () => "page");
}

function setView(view: View) {
  s.view = view;
  const url = new URL(location.href);
  if (view === "source") url.searchParams.set("view", "source");
  else url.searchParams.delete("view");
  history.replaceState(history.state, "", url);
  s.listeners.forEach((fn) => fn());
}

/** Switch between the finished page and its source. */
export function toggleView(origin: Origin = "switch") {
  if (!s.started) return;
  if (s.intro) finishIntro();
  if (s.anim) return;
  const point = origin === "switch" ? switchCenter() : origin;
  const turningOn = s.view === "page";

  if (s.reduced) {
    // A crossfade instead of the expanding lens.
    const root = html();
    if (turningOn) {
      root.dataset.view = "source";
      root.dataset.viewFade = "in";
      clearLayerClips();
      setView("source");
    } else {
      root.dataset.viewFade = "out";
      setView("page");
    }
    window.setTimeout(() => {
      if (!turningOn) {
        delete root.dataset.view;
        if (s.mode === "pointer") applyLayers(s.lens, s.r, true);
      }
      delete root.dataset.viewFade;
    }, 300);
    return;
  }

  const cover = coverRadius(point);
  html().dataset.viewAnim = "";
  if (turningOn) {
    const from = s.mode === "pointer" && s.pointer && dist(s.lens, point) < 4 ? s.r : 0;
    s.anim = { kind: "expand", origin: point, from, to: cover, start: performance.now() };
    setView("source");
  } else {
    const to = origin !== "switch" && s.mode === "pointer" && wantsLens(point) ? CURSOR_R : 0;
    s.anim = { kind: "collapse", origin: point, from: cover, to, start: performance.now() };
    delete html().dataset.view;
    for (const el of s.layers) setClip(el, 0, 0, 0);
    applyLayers(point, cover, true);
    setView("page");
  }
  wake();
}

/** Re-read the DOM after a navigation. */
export function rescan() {
  if (!s.started) return;
  s.io?.disconnect();
  s.visible.clear();
  s.layers = Array.from(document.querySelectorAll<HTMLElement>(".layer-source, .source-gutter"));
  s.targets = Array.from(document.querySelectorAll<HTMLElement>("[data-lens-target]"));
  s.glasses = Array.from(document.querySelectorAll<HTMLElement>("[data-glass]")).flatMap((el) => {
    const light = el.querySelector<HTMLElement>(":scope > .glass-spec > span");
    return light ? [{ el, light }] : [];
  });
  s.rest = document.querySelector<HTMLElement>(".lens-rest");
  s.hero = s.rest?.closest<HTMLElement>(".layered") ?? null;
  s.io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const el = e.target as HTMLElement;
      if (e.isIntersecting) s.visible.add(el);
      else {
        s.visible.delete(el);
        if (s.mode === "pointer") setClip(el, 0, 0, 0);
      }
    }
    s.lastApplied = -1;
    s.dirty = true;
    wake();
  });
  s.layers.forEach((el) => s.io!.observe(el));
  bindPuck();
  s.lastApplied = -1;
  s.dirty = true;
  wake();
}

/* ----------------------------------------------------------------------------
   Geometry
---------------------------------------------------------------------------- */

function dist(a: Vec, b: Vec) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function coverRadius(p: Vec) {
  const w = innerWidth, h = innerHeight;
  return Math.max(dist(p, { x: 0, y: 0 }), dist(p, { x: w, y: 0 }), dist(p, { x: 0, y: h }), dist(p, { x: w, y: h })) + 24;
}

function switchCenter(): Vec {
  const el = Array.from(document.querySelectorAll<HTMLElement>("[data-view-switch]")).find(
    (b) => b.offsetParent !== null,
  );
  if (!el) return { x: innerWidth / 2, y: 40 };
  const r = el.getBoundingClientRect();
  return { x: r.left + Math.min(r.width, 40) / 2 + 4, y: r.top + r.height / 2 };
}

function wantsLens(p: Vec): boolean {
  if (s.shift) return true;
  for (const el of s.targets) {
    const r = el.getBoundingClientRect();
    const e = Number(el.dataset.lensExtend ?? 0);
    if (p.x >= r.left - e && p.x <= r.right + e && p.y >= r.top - e && p.y <= r.bottom + e) return true;
  }
  return false;
}

function setClip(el: HTMLElement, x: number, y: number, r: number) {
  el.style.setProperty("--x", `${x.toFixed(1)}px`);
  el.style.setProperty("--y", `${y.toFixed(1)}px`);
  el.style.setProperty("--r", `${Math.max(0, r).toFixed(1)}px`);
}

function clearLayerClips() {
  for (const el of s.layers) {
    el.style.removeProperty("--x");
    el.style.removeProperty("--y");
    el.style.removeProperty("--r");
    el.style.clipPath = "";
  }
}

/** Center every visible Source layer's clip circle on a viewport point. */
function applyLayers(center: Vec, r: number, force = false) {
  if (!force && r < 0.25 && s.lastApplied === 0) return;
  const layers = Array.from(s.visible, (el) => [el, el.getBoundingClientRect()] as const);
  for (const [el, b] of layers) setClip(el, center.x - b.left, center.y - b.top, r < 0.25 ? 0 : r);
  s.lastApplied = r < 0.25 ? 0 : r;
}

/* ----------------------------------------------------------------------------
   The loop
---------------------------------------------------------------------------- */

function wake() {
  if (!s.raf && !document.hidden && s.started) s.raf = requestAnimationFrame(frame);
}

function frame(now: number) {
  s.raf = 0;
  const dt = s.last ? Math.min(0.05, (now - s.last) / 1000) : 1 / 60;
  s.last = now;

  // Read every rect before writing any style, so a frame never forces layout.
  const glass = s.dirty && s.pointer ? measureGlass() : null;
  for (const t of tasks) t.measure?.();

  let moving = false;
  if (s.intro) moving = stepIntro(now);
  else if (s.anim) moving = stepAnim(now);
  else if (s.view === "page" && s.mode === "pointer") moving = stepPointer(dt);

  if (glass) lightGlass(glass);
  for (const t of tasks) moving = t.step(s.pointer, dt) || moving;
  s.dirty = false;

  if (moving) wake();
  else s.last = 0;
}

function stepPointer(dt: number): boolean {
  const p = s.pointer;
  if (!p) return false;
  const want = s.inside && wantsLens(p) ? CURSOR_R : 0;

  if (s.reduced) {
    s.lens = { ...p };
    s.lensV = { x: 0, y: 0 };
    s.r = want;
    s.rV = 0;
  } else {
    // Critically damped follow for position, a softer spring for the radius.
    const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      s.lensV.x += (900 * (p.x - s.lens.x) - 60 * s.lensV.x) * h;
      s.lensV.y += (900 * (p.y - s.lens.y) - 60 * s.lensV.y) * h;
      s.lens.x += s.lensV.x * h;
      s.lens.y += s.lensV.y * h;
      s.rV += (230 * (want - s.r) - 21 * s.rV) * h;
      s.r += s.rV * h;
    }
    if (s.r < 0) {
      s.r = 0;
      s.rV = 0;
    }
  }

  const settled =
    Math.abs(p.x - s.lens.x) < 0.05 &&
    Math.abs(p.y - s.lens.y) < 0.05 &&
    Math.hypot(s.lensV.x, s.lensV.y) < 0.5 &&
    Math.abs(want - s.r) < 0.05 &&
    Math.abs(s.rV) < 0.5;
  if (settled) {
    s.lens = { ...p };
    s.lensV = { x: 0, y: 0 };
    s.r = want;
    s.rV = 0;
  }

  applyLayers(s.lens, s.r);
  drawCursor(s.lens, s.r, 1, want > 0 || s.r > 1);
  return !settled;
}

function stepAnim(now: number): boolean {
  const a = s.anim!;
  const t = clamp((now - a.start) / EXPAND_MS, 0, 1);
  const r = a.from + (a.to - a.from) * ease(t);
  const alpha = a.kind === "expand" ? 1 - smooth(0.45, 0.95, t) : smooth(0.55, 0.95, t);
  applyLayers(a.origin, r, true);
  drawCursor(a.origin, r, alpha, a.kind === "collapse" && t > 0.6 && s.mode === "pointer");

  if (t < 1) return true;
  s.anim = null;
  delete html().dataset.viewAnim;
  if (a.kind === "expand") {
    html().dataset.view = "source";
    clearLayerClips();
    drawCursor(a.origin, 0, 0, false);
    return false;
  }
  if (s.mode === "pointer" && s.pointer) {
    s.lens = { ...a.origin };
    s.r = a.to;
    s.rV = 0;
    s.dirty = true;
    return true;
  }
  // Keyboard only: hand the lens back to its resting place on the headline.
  clearLayerClips();
  drawCursor(a.origin, 0, 0, false);
  return false;
}

function drawCursor(c: Vec, r: number, alpha: number, showDot: boolean) {
  const lens = s.lensEl, dot = s.dotEl;
  if (!lens || !dot) return;
  const visible = r > 0.5 && alpha > 0.01;
  lens.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) scale(${(r / CURSOR_R).toFixed(4)})`;
  lens.style.visibility = visible ? "visible" : "hidden";
  // Opacity below 1 turns off refraction, so only use it while fading.
  lens.style.opacity = alpha >= 0.999 ? "" : alpha.toFixed(3);
  const p = s.pointer ?? c;
  dot.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
  dot.style.opacity = showDot && s.pointer && s.view === "page" ? "1" : "0";
  if (s.overLink) dot.dataset.link = "";
  else delete dot.dataset.link;
  if (s.specEl && s.pointer) {
    // The crescent leans toward where the cursor is heading.
    const lead = clamp((p.x - c.x) * 1.4 + (c.x / innerWidth - 0.5) * 24, -32, 32);
    s.specEl.style.transform = `rotate(${lead.toFixed(2)}deg)`;
  }
}

function measureGlass() {
  return s.glasses.map((g) => [g.light, g.el.getBoundingClientRect()] as const);
}

/** Nudge each glass surface's highlight toward the cursor. */
function lightGlass(glass: ReturnType<typeof measureGlass>) {
  const p = s.pointer;
  if (!p) return;
  for (const [light, b] of glass) {
    if (b.bottom < 0 || b.top > innerHeight || b.width === 0) continue;
    const dx = clamp((p.x - (b.left + b.width / 2)) / (b.width / 2 + 160), -1, 1) * b.width * 0.36;
    const dy = clamp((p.y - b.top) / (b.height + 240), -0.2, 1) * Math.min(b.height * 0.5, 24);
    light.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
  }
}

/* ----------------------------------------------------------------------------
   First visit: the page paints as source, then the Page layer wipes down over
   it and leaves the lens resting on the headline.
---------------------------------------------------------------------------- */

function stepIntro(now: number): boolean {
  const t = clamp((now - s.intro!.start) / INTRO_MS, 0, 1);
  const line = ease(t) * (innerHeight + 4);
  const rest = s.rest?.getBoundingClientRect();
  const layers = Array.from(s.visible, (el) => [el, el.getBoundingClientRect()] as const);
  for (const [el, b] of layers) {
    const y = clamp(line - b.top, 0, b.height);
    const inHero = rest && s.hero?.contains(el) && el.classList.contains("layer-source");
    let path = y < b.height ? `M0 ${y.toFixed(1)}H${b.width.toFixed(1)}V${b.height.toFixed(1)}H0Z` : "";
    if (inHero && rest) {
      const cx = rest.left + rest.width / 2 - b.left, cy = rest.top + rest.height / 2 - b.top, r = rest.width / 2;
      path += `M${(cx - r).toFixed(1)} ${cy.toFixed(1)}a${r} ${r} 0 1 1 ${2 * r} 0a${r} ${r} 0 1 1 ${-2 * r} 0Z`;
    }
    el.style.clipPath = path ? `path("${path}")` : "inset(100% 0 0 0)";
  }
  if (rest && s.rest) {
    const cy = rest.top + rest.height / 2;
    s.rest.style.opacity = smooth(cy - 60, cy + 40, line).toFixed(3);
  }
  if (t < 1) return true;
  finishIntro();
  return false;
}

function finishIntro() {
  s.intro = null;
  for (const el of s.layers) el.style.clipPath = "";
  if (s.rest) s.rest.style.opacity = "";
  delete html().dataset.intro;
  if (s.pointer && s.view === "page") enterPointerMode();
}

/* ----------------------------------------------------------------------------
   Input
---------------------------------------------------------------------------- */

function enterPointerMode() {
  if (s.mode === "pointer" || s.intro) return;
  const rest = s.rest?.getBoundingClientRect();
  const restVisible = rest && rest.bottom > 0 && rest.top < innerHeight && !html().dataset.view;
  if (restVisible && rest) {
    // Pick the resting lens up exactly where it is, then let it follow.
    s.lens = { x: rest.left + rest.width / 2, y: rest.top + rest.height / 2 };
    s.r = rest.width / 2;
  } else if (s.pointer) {
    s.lens = { ...s.pointer };
    s.r = 0;
  }
  s.lensV = { x: 0, y: 0 };
  s.rV = 0;
  s.mode = "pointer";
  html().dataset.lens = "pointer";
  s.lastApplied = -1;
  applyLayers(s.lens, s.r, true);
  drawCursor(s.lens, s.r, 1, true);
  wake();
}

function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
}

function setPeek(on: boolean) {
  if (s.shift === on) return;
  s.shift = on;
  if (on) html().dataset.peek = "";
  else delete html().dataset.peek;
  s.dirty = true;
  wake();
}

const handlers = {
  pointermove(e: PointerEvent) {
    if (e.pointerType === "touch") return;
    s.pointer = { x: e.clientX, y: e.clientY };
    s.inside = true;
    s.overLink = !!(e.target as Element | null)?.closest?.(".layer-source a");
    s.dirty = true;
    if (s.mode === "rest" && !s.intro && s.view === "page") enterPointerMode();
    wake();
  },
  pointerout(e: PointerEvent) {
    if (e.relatedTarget === null && e.pointerType !== "touch") {
      s.inside = false;
      s.dirty = true;
      wake();
    }
  },
  scroll() {
    s.dirty = true;
    if (s.mode === "pointer" || s.anim || s.intro) wake();
  },
  resize() {
    s.dirty = true;
    s.lastApplied = -1;
    wake();
  },
  keydown(e: KeyboardEvent) {
    if (e.key === "Shift") {
      if (!e.repeat && !isTyping(e) && !e.metaKey && !e.ctrlKey && !e.altKey && s.pointer && s.view === "page") {
        if (s.mode === "rest") enterPointerMode();
        setPeek(true);
      }
      return;
    }
    // Shift+Tab and friends are not a peek.
    if (s.shift) setPeek(false);
    if ((e.key === "v" || e.key === "V") && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping(e)) {
      if (document.querySelector("dialog[open]")) return;
      e.preventDefault();
      toggleView("switch");
    }
  },
  keyup(e: KeyboardEvent) {
    if (e.key === "Shift") setPeek(false);
  },
  blur() {
    setPeek(false);
  },
  visibilitychange() {
    if (document.hidden && s.raf) {
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      s.last = 0;
    } else wake();
  },
};

/* Touch: the resting lens is a glass puck you can drag across the hero. */
let puckBound: HTMLElement | null = null;
function bindPuck() {
  const rest = s.rest, hero = s.hero;
  if (!rest || !hero || puckBound === rest) return;
  puckBound = rest;
  let grab: Vec | null = null;
  rest.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    const r = rest.getBoundingClientRect();
    grab = { x: e.clientX - (r.left + r.width / 2), y: e.clientY - (r.top + r.height / 2) };
    rest.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  rest.addEventListener("pointermove", (e) => {
    if (!grab) return;
    const b = hero.getBoundingClientRect();
    const x = clamp(e.clientX - grab.x - b.left, 0, b.width);
    const y = clamp(e.clientY - grab.y - b.top, 0, b.height);
    hero.style.setProperty("--rest-x", `${x.toFixed(1)}px`);
    hero.style.setProperty("--rest-y", `${y.toFixed(1)}px`);
  });
  const release = () => {
    grab = null;
  };
  rest.addEventListener("pointerup", release);
  rest.addEventListener("pointercancel", release);
}

/* ----------------------------------------------------------------------------
   Refraction: a displacement map that bends the backdrop inward at the rim.
   Chromium applies SVG filters in backdrop-filter; other engines get a blur.
---------------------------------------------------------------------------- */

function displacementMap(size: number): string {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(size, size);
  const half = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5 - half) / half, dy = (y + 0.5 - half) / half;
      const d = Math.hypot(dx, dy);
      const k = d > 1 ? 0 : smooth(0.82, 0.985, d) * (1 - smooth(0.985, 1, d) * 0.6);
      const nx = d ? dx / d : 0, ny = d ? dy / d : 0;
      const i = (y * size + x) * 4;
      img.data[i] = 128 - nx * k * 127;
      img.data[i + 1] = 128 - ny * k * 127;
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

function setupOptics() {
  const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands;
  if (!brands?.some((b) => b.brand === "Chromium")) return;
  const fill = (id: string, size: number) => {
    const filter = document.getElementById(id);
    const img = filter?.querySelector("feImage");
    if (!filter || !img || !size) return;
    const px = String(Math.round(size));
    img.setAttribute("href", displacementMap(Math.round(size)));
    for (const el of [filter, img]) {
      el.setAttribute("width", px);
      el.setAttribute("height", px);
    }
  };
  fill("lens-refraction", CURSOR_R * 2);
  const restSize = s.rest?.getBoundingClientRect().width ?? 0;
  fill("lens-refraction-rest", restSize);
  document.querySelectorAll<HTMLElement>(".lens-refract").forEach((el) => (el.dataset.optics = "displace"));
}

/* ----------------------------------------------------------------------------
   Start
---------------------------------------------------------------------------- */

function start() {
  if (s.started) return;
  s.started = true;
  const root = html();
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  s.reduced = motion.matches;
  motion.addEventListener("change", (e) => (s.reduced = e.matches));
  s.view = root.dataset.view === "source" ? "source" : "page";
  s.lensEl = document.querySelector<HTMLElement>(".lens");
  s.dotEl = document.querySelector<HTMLElement>(".lens-dot");
  s.specEl = s.lensEl?.querySelector<HTMLElement>(".lens-spec") ?? null;

  addEventListener("pointermove", handlers.pointermove, { passive: true });
  document.addEventListener("pointerout", handlers.pointerout, { passive: true });
  addEventListener("scroll", handlers.scroll, { passive: true });
  addEventListener("resize", handlers.resize, { passive: true });
  addEventListener("keydown", handlers.keydown);
  addEventListener("keyup", handlers.keyup);
  addEventListener("blur", handlers.blur);
  document.addEventListener("visibilitychange", handlers.visibilitychange);

  rescan();
  setupOptics();
  s.listeners.forEach((fn) => fn());

  if (root.dataset.intro) {
    root.dataset.intro = "run";
    // Wait for the fonts so the wipe runs over the final layout.
    const go = () => {
      if (s.intro || !root.dataset.intro) return;
      s.intro = { start: performance.now() };
      wake();
    };
    document.fonts.ready.then(go);
    window.setTimeout(go, 600);
  }
}

/* ----------------------------------------------------------------------------
   React
---------------------------------------------------------------------------- */

/** Glass internals shared by the cursor lens and the resting lens. */
function LensOptics({ filter }: { filter: string }) {
  return (
    <>
      <span className="lens-refract" style={{ ["--refraction" as string]: `url(#${filter})` }} />
      <span className="lens-fringe" />
      <span className="lens-rim" />
      <span className="lens-spec" />
    </>
  );
}

/** The lens as it rests on the hero headline before the visitor moves. */
export function RestingLens() {
  return (
    <span className="lens-rest" aria-hidden="true">
      <LensOptics filter="lens-refraction-rest" />
      <span className="lens-dot-rest" />
    </span>
  );
}

export function LensRoot() {
  const pathname = usePathname();

  useEffect(() => {
    start();
    console.log(
      "%cHello, fellow developer.%c\n\nThis page has a second layer. Hold Shift to peek at it, or press V to switch to it.\nThe code is on GitHub, and my inbox is open: hello@yourname.dev",
      "font: 600 15px/1.4 system-ui, sans-serif",
      "font: 400 13px/1.5 system-ui, sans-serif",
    );
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => rescan());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return (
    <>
      <div className="lens" aria-hidden="true">
        <LensOptics filter="lens-refraction" />
      </div>
      <div className="lens-dot" aria-hidden="true" />
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
        {["lens-refraction", "lens-refraction-rest"].map((id) => (
          <filter
            key={id}
            id={id}
            x="0"
            y="0"
            width="200"
            height="200"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage x="0" y="0" width="200" height="200" preserveAspectRatio="none" result="map" />
            <feDisplacementMap in="SourceGraphic" in2="map" scale="20" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        ))}
      </svg>
    </>
  );
}
