import Link from "next/link";

import { Layered } from "@/components/layered";

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1}>
      <Layered
        as="section"
        labelledBy="nf-title"
        page={
          <div className="wrap min-h-[70svh] pb-[var(--section-space)] pt-[var(--hero-pt)]">
            <h1 id="nf-title" className="t-hero col-span-12 lg:col-span-9">
              This page doesn&apos;t exist.
            </h1>
            <p className="t-lede col-span-12 mt-8">
              <Link href="/" className="link">
                Go to the home page
              </Link>
            </p>
          </div>
        }
        source={
          <div className="wrap min-h-[70svh] pb-[var(--section-space)] pt-[var(--hero-pt)]">
            <pre className="src-pre col-span-12 text-[15px] leading-[24px]">
              <span className="tk-k">HTTP/2</span> <span className="tk-n">404</span>
              {"\n"}
              <span className="tk-c">{"// nothing was ever deployed at this path"}</span>
            </pre>
          </div>
        }
      />
    </main>
  );
}
