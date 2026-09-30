"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ComponentType } from "react";

import { person } from "@/content/site";
import { loadMotion, whenIdle } from "@/lib/load-motion";

import { GlassSpec } from "./glass";
import { toggleView, useView } from "./lens";
import { openPalette } from "./command-palette";

const SECTIONS = [
  { id: "work", label: "Work" },
  { id: "experience", label: "Experience" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/** Which section crosses the middle of the viewport. Case studies belong to Work. */
function useActiveSection(): SectionId | null {
  const pathname = usePathname();
  const [active, setActive] = useState<SectionId | null>(null);

  useEffect(() => {
    if (pathname !== "/") return;
    const inView = new Set<SectionId>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = e.target.id as SectionId;
          if (e.isIntersecting) inView.add(id);
          else inView.delete(id);
        }
        setActive(SECTIONS.find((s) => inView.has(s.id))?.id ?? null);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [pathname]);

  if (pathname === "/") return active;
  return pathname.startsWith("/work") ? "work" : null;
}

function ViewSourceSwitch() {
  const view = useView();
  const on = view === "source";
  return (
    <div className="relative flex">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-describedby="view-source-tip"
        aria-keyshortcuts="V"
        data-view-switch
        className="switch"
        onClick={(e) => toggleView(e.detail === 0 ? "switch" : { x: e.clientX, y: e.clientY })}
      >
        <span className="switch-track" aria-hidden="true">
          <span className="switch-thumb" />
        </span>
        <span className="switch-label">View source</span>
      </button>
      <span id="view-source-tip" role="tooltip" className="switch-tip">
        View source (V). Hold Shift to peek.
      </span>
    </div>
  );
}

const noop = () => () => {};
const isMac = () =>
  /mac|iphone|ipad/i.test(
    (navigator as Navigator & { userAgentData?: { platform: string } }).userAgentData?.platform ?? navigator.platform,
  );

function PaletteHint() {
  // ⌘K on the server and on Apple devices, Ctrl K everywhere else.
  const mac = useSyncExternalStore(noop, isMac, () => true);
  return (
    <button type="button" className="palette-hint" onClick={openPalette} aria-keyshortcuts="Meta+K Control+K">
      <span className="sr-only">Open command palette, </span>
      <kbd className="keycap w-[3.25rem]">{mac ? "⌘K" : "Ctrl K"}</kbd>
    </button>
  );
}

/** The marker is static until Motion loads at idle, then it springs between links. */
function useMarker() {
  const [Marker, setMarker] = useState<ComponentType | null>(null);
  useEffect(() => {
    whenIdle(() => loadMotion().then((m) => setMarker(() => m.MotionMarker)));
  }, []);
  return Marker;
}

export function Nav() {
  const active = useActiveSection();
  const pathname = usePathname();
  const home = pathname === "/";
  const Marker = useMarker();

  return (
    <header className="site-nav" data-site-nav>
      <nav aria-label="Primary" className="nav glass" data-glass>
        <GlassSpec />
        <Link href="/" className="nav-name">
          {person.name}
        </Link>
        <ul className="nav-links">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <Link
                href={home ? `#${s.id}` : `/#${s.id}`}
                className="nav-link"
                aria-current={home && active === s.id ? "location" : undefined}
              >
                {active === s.id ? Marker ? <Marker /> : <span className="nav-marker" /> : null}
                <span className="relative">{s.label}</span>
              </Link>
            </li>
          ))}
        </ul>
        <span className="nav-divider" aria-hidden="true" />
        <ViewSourceSwitch />
        <PaletteHint />
      </nav>
    </header>
  );
}
