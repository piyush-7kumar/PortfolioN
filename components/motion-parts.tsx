"use client";

/*
 * Everything that animates with Motion, loaded after the page is idle so none
 * of it competes with the first paint. Until it arrives the nav marker is a
 * static pill and toasts appear without a transition.
 */

import { AnimatePresence, LazyMotion, MotionConfig, domMax } from "framer-motion";
import * as m from "motion/react-m";
import type { ReactNode } from "react";

const spring = { type: "spring", stiffness: 520, damping: 42, mass: 0.9 } as const;

function Motion({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

/** The glass marker under the active nav link. It springs to the next link. */
export function MotionMarker() {
  return (
    <Motion>
      <m.span layoutId="nav-marker" className="nav-marker" transition={spring} />
    </Motion>
  );
}

export function MotionToast({ id, children }: { id: number | null; children: ReactNode }) {
  return (
    <Motion>
      <AnimatePresence>
        {id !== null ? (
          <m.div
            key={id}
            className="toast glass"
            data-glass
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {children}
          </m.div>
        ) : null}
      </AnimatePresence>
    </Motion>
  );
}
