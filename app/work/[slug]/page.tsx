import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BrowserFrame, FrameSource } from "@/components/browser-frame";
import { Diagram } from "@/components/diagram";
import { Layered } from "@/components/layered";
import { Proof } from "@/components/proof";
import { projects, sections, type Project } from "@/content/site";
import { Code, escapeHtml, highlightHtml } from "@/lib/highlight";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.outcome,
    alternates: { canonical: `/work/${p.slug}` },
    openGraph: { title: p.title, description: p.outcome, url: `/work/${p.slug}`, type: "article" },
  };
}

/** A section of prose, with its Markdown source underneath. */
function Prose({ id, title, paragraphs }: { id: string; title: string; paragraphs: string[] }) {
  const markdown = `## ${title}\n\n${paragraphs.join("\n\n")}`;
  return (
    <Layered
      as="section"
      labelledBy={id}
      page={
        <div className="wrap pt-[clamp(56px,7vw,96px)]">
          <div className="col-span-12 md:col-span-9 lg:col-span-7">
            <h2 id={id} className="t-h3">
              {title}
            </h2>
            <div className="measure mt-5 space-y-5">
              {paragraphs.map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      }
      source={
        <div className="wrap pt-[clamp(56px,7vw,96px)]">
          <pre
            className="src-pre src-wrap col-span-12 text-[13.5px] leading-[22px] md:col-span-9 lg:col-span-7"
            dangerouslySetInnerHTML={{
              __html: markdown
                .split("\n")
                .map((line) => (line.startsWith("## ") ? `<span class="tk-k">${escapeHtml(line)}</span>` : escapeHtml(line)))
                .join("\n"),
            }}
          />
        </div>
      }
    />
  );
}

function Frontmatter({ p }: { p: Project }) {
  const fields: [string, string][] = [
    ["title", p.title],
    ["company", p.company],
    ["role", p.role],
    ["year", p.year],
    ["stack", `[${p.stack.join(", ")}]`],
    ["url", `https://${p.url}`],
  ];
  return (
    <>
      <span className="tk-d">---</span>
      {"\n"}
      {fields.map(([k, v]) => (
        <span key={k}>
          <span className="tk-p">{k}</span>
          <span className="tk-d">: </span>
          <span className={/^\d+$/.test(v) ? "tk-n" : "tk-s"}>{v}</span>
          {"\n"}
        </span>
      ))}
      <span className="tk-d">---</span>
    </>
  );
}

function Header({ p }: { p: Project }) {
  return (
    <>
      <Layered
        as="header"
        page={
          <div className="wrap pt-[var(--hero-pt)]">
            <h1 className="t-hero col-span-12 lg:col-span-11">{p.title}</h1>
            <p className="t-lede measure col-span-12 mt-8 md:col-span-9 lg:col-span-8">{p.outcome}</p>
            <dl className="t-small col-span-12 mt-10 grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-4 lg:col-span-10">
              {[
                ["Company", p.company],
                ["Role", p.role],
                ["Year", p.year],
                ["Stack", p.stack.join(", ")],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-slate">{k}</dt>
                  <dd className="mt-1">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        }
        source={
          <div className="wrap pt-[var(--hero-pt)]">
            <p className="tk-c col-span-12 text-[13px]">{`// content/work/${p.slug}.md`}</p>
            <pre className="src-pre src-wrap col-span-12 mt-3 text-[clamp(13px,1.3vw,16px)] leading-[1.7]">
              <Frontmatter p={p} />
            </pre>
          </div>
        }
      />
      <Layered
        page={
          <div className="wrap pt-[clamp(48px,6vw,80px)]">
            <div className="col-span-12" data-lens-target>
              <BrowserFrame
                slug={p.slug}
                url={p.url}
                image={p.image.src}
                alt={p.image.alt}
                sizes="(min-width: 1248px) 1200px, calc(100vw - 32px)"
                eager
              />
            </div>
          </div>
        }
        source={
          <div className="wrap pt-[clamp(48px,6vw,80px)]">
            <div className="col-span-12">
              <FrameSource url={p.url}>
                <div className="absolute inset-0 grid grid-rows-[58%_1fr] gap-4 px-[4%] pb-6 pt-4 max-sm:hidden">
                  <Diagram data={p.architecture} variant="source" className="h-full w-full" />
                  <div className="mx-auto w-full max-w-[720px]">
                    <Proof proof={p.proof} />
                  </div>
                </div>
                <div className="absolute inset-0 px-3 pt-1 sm:hidden">
                  <Proof proof={p.proof} compact />
                </div>
              </FrameSource>
            </div>
          </div>
        }
      />
    </>
  );
}

/** A heading and a sentence, with nothing underneath but a comment. */
function Intro({ id, title, text, comment }: { id: string; title: string; text: string; comment: string }) {
  return (
    <Layered
      page={
        <div className="wrap pt-[clamp(56px,7vw,96px)]">
          <h2 id={id} className="t-h3 col-span-12">
            {title}
          </h2>
          <p className="measure col-span-12 mt-5 md:col-span-9 lg:col-span-7">{text}</p>
        </div>
      }
      source={
        <div className="wrap pt-[clamp(56px,7vw,96px)]">
          <p className="tk-c src-wrap col-span-12 md:col-span-9 lg:col-span-7">{`// ${comment}`}</p>
        </div>
      }
    />
  );
}

function Architecture({ p }: { p: Project }) {
  return (
    <section aria-labelledby="architecture">
      <Intro
        id="architecture"
        title="Architecture"
        text={sections.caseStudy.architecture}
        comment="blue: client, green: service, yellow: data, orange: external"
      />
      <Layered
        page={
          <div className="wrap pt-10">
            <figure className="diagram-scroll col-span-12 lg:col-span-10" data-lens-target>
              <Diagram data={p.architecture} variant="page" title={`Architecture of ${p.title}`} />
            </figure>
          </div>
        }
        source={
          <div className="wrap pt-10">
            <div className="diagram-scroll col-span-12 lg:col-span-10">
              <Diagram data={p.architecture} variant="source" />
            </div>
          </div>
        }
      />
    </section>
  );
}

function KeyCode({ p }: { p: Project }) {
  const { code } = p.caseStudy;
  const lang = code.language;
  const lines = code.code.split("\n").length;
  return (
    <section aria-labelledby="key-code">
      <Intro id="key-code" title="Key code" text={code.caption} comment="the same file, as it's actually written" />
      <Layered
        page={
          <div className="wrap pt-8">
            <figure className="code-panel col-span-12 overflow-x-auto lg:col-span-10" data-lens-target>
              <figcaption className="t-small px-6 pt-5 leading-[22px] text-slate">{code.filename}</figcaption>
              <pre className="page-code px-6 pb-6 pt-3">
                <code dangerouslySetInnerHTML={{ __html: highlightHtml(code.code, lang, "page") }} />
              </pre>
            </figure>
          </div>
        }
        source={
          <div className="wrap pt-8">
            <div className="src-panel col-span-12 overflow-hidden lg:col-span-10">
              <p className="px-6 pt-5 text-[13px] leading-[22px] text-comment">{code.filename}</p>
              <div className="flex px-6 pb-6 pt-3">
                <pre className="source-code select-none pr-5 text-right text-comment">
                  {Array.from({ length: lines }, (_, i) => i + 1).join("\n")}
                </pre>
                <Code code={code.code} lang={lang} className="source-code min-w-0 overflow-hidden" />
              </div>
            </div>
          </div>
        }
      />
    </section>
  );
}

function Results({ p }: { p: Project }) {
  return (
    <Layered
      as="section"
      labelledBy="results"
      page={
        <div className="wrap pt-[clamp(56px,7vw,96px)]">
          <div className="col-span-12 md:col-span-9 lg:col-span-7">
            <h2 id="results" className="t-h3">
              Results
            </h2>
            <ul className="measure mt-5 space-y-4">
              {p.caseStudy.results.map((r) => (
                <li key={r} className="border-l border-hairline pl-5">
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>
      }
      source={
        <div className="wrap pt-[clamp(56px,7vw,96px)]">
          <div className="col-span-12 md:col-span-9 lg:col-span-7">
            <Proof proof={p.proof} />
          </div>
        </div>
      }
    />
  );
}

function NextProject({ next }: { next: Project }) {
  return (
    <Layered
      as="section"
      labelledBy="next-project"
      page={
        <div className="wrap py-[var(--section-space)]">
          <div className="relative col-span-12 grid grid-cols-subgrid items-center gap-y-8">
            <div className="col-span-12 md:col-span-6 lg:col-span-5">
              <h2 id="next-project" className="t-h3">
                Next project
              </h2>
              <p className="t-h2 mt-5">
                <Link href={`/work/${next.slug}`} className="stretched-link">
                  {next.title}
                </Link>
              </p>
              <p className="measure mt-5 text-slate">{next.outcome}</p>
            </div>
            <div className="col-span-12 md:col-span-6 lg:col-span-6 lg:col-start-7">
              <BrowserFrame
                slug={next.slug}
                url={next.url}
                image={next.image.src}
                alt=""
                sizes="(min-width: 1248px) 592px, (min-width: 768px) 48vw, calc(100vw - 32px)"
              />
            </div>
          </div>
        </div>
      }
      source={
        <div className="wrap py-[var(--section-space)]">
          <div className="col-span-12 grid grid-cols-subgrid items-center gap-y-8">
            <Code
              code={`<Link href="/work/${next.slug}">\n  ${next.title}\n</Link>`}
              lang="tsx"
              wrap
              className="col-span-12 text-[14px] leading-[22px] md:col-span-6 lg:col-span-5"
            />
          </div>
        </div>
      }
    />
  );
}

export default async function CaseStudy({ params }: Params) {
  const { slug } = await params;
  const index = projects.findIndex((p) => p.slug === slug);
  if (index < 0) notFound();
  const p = projects[index];
  const next = projects[(index + 1) % projects.length];

  return (
    <main id="main" tabIndex={-1}>
      <Header p={p} />
      <Prose id="context" title="Context" paragraphs={p.caseStudy.context} />
      <Prose id="problem" title="Problem" paragraphs={p.caseStudy.problem} />
      <Prose id="approach" title="Approach" paragraphs={p.caseStudy.approach} />
      <Architecture p={p} />
      <KeyCode p={p} />
      <Results p={p} />
      <NextProject next={next} />
    </main>
  );
}
