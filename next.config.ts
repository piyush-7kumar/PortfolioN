import type { NextConfig } from "next";
import { execSync } from "node:child_process";

/** Short SHA of the commit being deployed, for the footer. */
function commitSha(): string {
  const fromEnv =
    process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? process.env.COMMIT_SHA;
  if (fromEnv) return fromEnv.slice(0, 7);
  try {
    return execSync("git rev-parse --short=7 HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_COMMIT_SHA: commitSha(),
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
  },
  async headers() {
    return [
      {
        source: "/fonts/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
