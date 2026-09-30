#!/usr/bin/env node
/*
 * Prints /resume to public/resume.pdf with headless Chrome, so the PDF always
 * matches content/site.ts. Start the site first (npm run build && npm start),
 * then run: npm run resume [-- http://localhost:3000]
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const base = process.argv[2] ?? "http://localhost:3000";
const out = resolve("public/resume.pdf");
const candidates = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
].filter(Boolean);
const chrome = candidates.find((p) => existsSync(p));
if (!chrome) {
  console.error("Couldn't find Chrome. Set CHROME_PATH to your Chrome or Chromium binary.");
  process.exit(1);
}

execFileSync(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--no-pdf-header-footer",
  "--run-all-compositor-stages-before-draw",
  "--virtual-time-budget=4000",
  `--print-to-pdf=${out}`,
  `${base}/resume`,
], { stdio: "inherit" });
console.log(`Wrote ${out}`);
