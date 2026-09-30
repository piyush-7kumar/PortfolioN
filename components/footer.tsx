import { person } from "@/content/site";
import { escapeHtml, highlightHtml } from "@/lib/highlight";

import { Layered } from "./layered";

export function Footer() {
  const sha = process.env.NEXT_PUBLIC_COMMIT_SHA ?? "unknown";
  const commitUrl = `${person.links.repository}/commit/${sha}`;
  return (
    <Layered
      as="footer"
      className="site-footer"
      page={
        <div className="wrap gap-y-4 pb-[max(40px,env(safe-area-inset-bottom))] pt-10 max-md:pb-28">
          <p className="t-small col-span-12 text-slate md:col-span-7 lg:col-span-8">
            Built with Next.js and deployed from commit{" "}
            <a href={commitUrl} className="link tabular-nums text-ink">
              {sha}
            </a>
            .
          </p>
          <p className="t-small col-span-12 flex flex-wrap gap-x-6 gap-y-2 whitespace-nowrap md:col-span-5 md:justify-end lg:col-span-4">
            <a href={person.links.repository} className="link">
              Repository on GitHub
            </a>
            <a href="#top" className="link">
              Back to top
            </a>
          </p>
        </div>
      }
      source={
        <div className="wrap pb-[max(40px,env(safe-area-inset-bottom))] pt-10 max-md:pb-28">
          <pre
            className="src-pre src-wrap col-span-12 text-[13px] leading-[20px]"
            dangerouslySetInnerHTML={{
              __html: [
                `<span class="tk-d">$ </span>${highlightHtml("git rev-parse --short HEAD", "bash")}`,
                `<a href="${escapeHtml(commitUrl)}" tabindex="-1" class="tk-n">${escapeHtml(sha)}</a>`,
                `<span class="tk-d">$ </span>${highlightHtml(`open "${person.links.repository}"`, "bash")}`,
              ].join("\n"),
            }}
          />
        </div>
      }
    />
  );
}
