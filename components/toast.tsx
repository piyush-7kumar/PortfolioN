"use client";

import { useEffect, useState, useSyncExternalStore, type ComponentType, type ReactNode } from "react";

import { loadMotion, whenIdle } from "@/lib/load-motion";

import { GlassSpec } from "./glass";

type Toast = { id: number; message: string };

let current: Toast | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

/** Show a short confirmation, e.g. "Email address copied". */
export function toast(message: string) {
  current = { id: Date.now(), message };
  listeners.forEach((fn) => fn());
  clearTimeout(timer);
  timer = setTimeout(() => {
    current = null;
    listeners.forEach((fn) => fn());
  }, 2600);
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

type Animated = ComponentType<{ id: number | null; children: ReactNode }>;

export function Toaster() {
  const t = useSyncExternalStore(subscribe, () => current, () => null);
  const [Animated, setAnimated] = useState<Animated | null>(null);

  useEffect(() => {
    whenIdle(() => loadMotion().then((m) => setAnimated(() => m.MotionToast)));
  }, []);

  const body = t ? (
    <>
      <GlassSpec />
      {t.message}
    </>
  ) : null;

  // The live region is always in the page so screen readers announce changes.
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 max-md:bottom-[92px]"
    >
      {Animated ? (
        <Animated id={t?.id ?? null}>{body}</Animated>
      ) : t ? (
        <div key={t.id} className="toast glass" data-glass>
          {body}
        </div>
      ) : null}
    </div>
  );
}
