"use client";

import { copyEmail } from "@/lib/actions";

import { GlassSpec } from "./glass";

export function CopyEmailButton() {
  return (
    <button
      type="button"
      onClick={copyEmail}
      className="glass copy-email rounded-full px-8 py-4 text-[1.25rem] font-semibold leading-none"
      data-glass
    >
      <GlassSpec />
      Copy email address
    </button>
  );
}
