import Link from "next/link";

import { projects, sections, type Project } from "@/content/site";
import { Code, toLiteral } from "@/lib/highlight";

import { BrowserFrame, FrameSource } from "./browser-frame";
import { Diagram, DiagramText } from "./diagram";
import { Layered } from "./layered";
import { Proof } from "./proof";

function projectLiteral(p: Project) {
  return toLiteral({
    slug: p.slug,
    title: p.title,
    company: p.company,
    role: p.role,
    year: Number.isNaN(Number(p.year)) ? p.year : Number(p.year),
    stack: p.stack,
    href: `/work/${p.slug}`,
  }, 1);
}

function ProjectRow({ project, index }: { project: Project; index: number }) {
  const first = index === 0;
  const last = index === projects.length - 1;
  const textCols = first ? "lg:col-span-4" : "lg:col-span-5";
  const frameCols = first ? "lg:col-span-8 lg:col-start-5" : "lg:col-span-7 lg:col-start-6";
  const pad = `${first ? "pt-4" : "pt-[clamp(80px,10vw,136px)]"} ${last ? "pb-[var(--section-space)]" : ""}`;
  const titleId = `project-${project.slug}`;
  const sizes = first
    ? "(min-width: 1248px) 792px, (min-width: 1024px) 64vw, calc(100vw - 32px)"
    : "(min-width: 1248px) 692px, (min-width: 1024px) 56vw, calc(100vw - 32px)";

  return (
    <Layered
      as="article"
      labelledBy={titleId}
      page={
        <div className={`wrap ${pad}`}>
          <div className="relative col-span-12 grid grid-cols-subgrid">
            <div className={`col-span-12 max-lg:order-2 max-lg:mt-8 md:col-span-9 ${textCols}`}>
              <h3 id={titleId} className="t-h3">
                <Link href={`/work/${project.slug}`} className="stretched-link project-link">
                  {project.title}
                </Link>
              </h3>
              <p className="mt-4 text-pretty">{project.outcome}</p>
              <dl className="t-small mt-6 grid grid-cols-[4.5rem_1fr] gap-x-4 gap-y-1.5">
                <dt className="text-slate">Role</dt>
                <dd>{project.role}</dd>
                <dt className="text-slate">Year</dt>
                <dd>{project.year}</dd>
                <dt className="text-slate">Stack</dt>
                <dd>{project.stack.join(", ")}</dd>
              </dl>
            </div>
            <div className={`col-span-12 max-lg:order-1 ${frameCols}`} data-lens-target>
              <BrowserFrame
                slug={project.slug}
                url={project.url}
                image={project.image.src}
                alt={project.image.alt}
                sizes={sizes}
              />
            </div>
          </div>
        </div>
      }
      source={
        <div className={`wrap ${pad}`}>
          <div className="relative col-span-12 grid grid-cols-subgrid">
            <div className={`col-span-12 max-lg:order-2 max-lg:mt-8 md:col-span-9 ${textCols}`}>
              <Code
                code={`  ${projectLiteral(project)},`}
                className="text-[13px] leading-[21px] max-sm:whitespace-pre-wrap max-sm:text-[12px] max-sm:leading-[19px]"
              />
              <div className="mt-5 sm:hidden">
                <p className="tk-c text-[11px] leading-[18px]">{"// architecture"}</p>
                <DiagramText data={project.architecture} />
              </div>
            </div>
            <div className={`col-span-12 max-lg:order-1 ${frameCols}`}>
              <FrameSource url={project.url}>
                <div className="absolute inset-0 grid grid-rows-[55%_1fr] gap-3 px-5 pb-4 pt-2 max-sm:hidden">
                  <Diagram data={project.architecture} variant="source" className="h-full w-full" />
                  <Proof proof={project.proof} compact />
                </div>
                <div className="absolute inset-0 px-3 pt-1 sm:hidden">
                  <Proof proof={project.proof} compact />
                </div>
              </FrameSource>
            </div>
          </div>
          {last ? <p className="col-span-12 mt-6">{"];"}</p> : null}
        </div>
      }
    />
  );
}

export function Work() {
  return (
    <section id="work" aria-labelledby="work-title">
      <Layered
        page={
          <div className="wrap pb-[clamp(40px,5vw,64px)] pt-[var(--section-space)]">
            <h2 id="work-title" tabIndex={-1} className="t-h2 col-span-12">
              {sections.work.title}
            </h2>
            <p className="measure col-span-12 mt-6 text-slate md:col-span-8 lg:col-span-6">{sections.work.intro}</p>
          </div>
        }
        source={
          <div className="wrap pb-[clamp(40px,5vw,64px)] pt-[var(--section-space)]">
            <p className="tk-c col-span-12">{"// content/site.ts"}</p>
            <Code
              code={'import type { Project } from "./types";\n\nexport const projects: Project[] = ['}
              className="col-span-12 mt-2"
            />
          </div>
        }
      />
      {projects.map((p, i) => (
        <ProjectRow key={p.slug} project={p} index={i} />
      ))}
    </section>
  );
}
