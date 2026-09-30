import { experience, sections, type Branch, type GraphRow } from "@/content/site";
import { escapeHtml } from "@/lib/highlight";

import { Layered } from "./layered";

/*
 * The experience timeline is a git commit graph. Each row is its own layered
 * block, so the Source layer's `git log --graph --oneline` line for a role
 * sits directly beneath that role. Lanes line up with the ASCII graph: the
 * Source is set at 15px, so each character is 9px and a lane is two of them.
 */

const LANE = (i: number) => 4.5 + i * 18;
const laneOf = (b: Branch) => (b === "main" ? 0 : 1);
const LINE = 20; // Source line height; row paddings are multiples of it

const dates = (start: string, end: string) => (end === "now" ? `Since ${start}` : `${start}–${end}`);

const laneColor: Record<Branch, string> = {
  main: "tk-p",
  oss: "tk-s",
  freelance: "tk-k",
};

function Lane({ branch, top = 0, bottom = 0 }: { branch: Branch; top?: number | string; bottom?: number | string }) {
  return (
    <span
      className="graph-lane absolute w-[1.5px] -translate-x-1/2"
      data-branch={branch}
      style={{
        left: LANE(laneOf(branch)),
        top,
        bottom,
        background: branch === "main" ? "var(--ink)" : "var(--slate)",
      }}
    />
  );
}

function Node({ branch, y, hollow = false }: { branch: Branch; y: number; hollow?: boolean }) {
  const size = hollow ? 9 : 11;
  return (
    <span
      className="graph-node absolute rounded-full"
      data-branch={branch}
      style={{
        left: LANE(laneOf(branch)) - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        background: hollow ? "var(--canvas)" : branch === "main" ? "var(--ink)" : "var(--canvas)",
        boxShadow: `inset 0 0 0 1.5px ${branch === "main" ? "var(--ink)" : "var(--slate)"}`,
      }}
    />
  );
}

/** A curve between lanes for merge and fork rows. */
function Curve({ branch, d, height }: { branch: Branch; d: string; height: number }) {
  return (
    <svg className="graph-lane absolute left-0 top-0 overflow-visible" width="40" height={height} data-branch={branch} aria-hidden="true">
      <path d={d} fill="none" stroke="var(--slate)" strokeWidth="1.5" />
    </svg>
  );
}

/** The ASCII graph prefix for a row's lanes: "| " per lane, with "*" on the commit's lane. */
function lanesHtml(lanes: Branch[], star?: Branch) {
  return lanes
    .map((b, i) => `<span class="${laneColor[b]}">${star === b ? "*" : "|"}</span>${i < lanes.length - 1 || star ? " " : ""}`)
    .join("");
}

/** One line of the log. Rows are plain markup: React never hydrates them. */
const line = (html: string, cls = "") => `<span class="block min-h-5 ${cls}">${html}</span>`;

/*
 * A commit's line of `git log --graph`. The "|" characters that continue each
 * lane above and below it are drawn by CSS (.log-lane), so a tall row costs
 * three elements instead of a line of markup per 20px.
 */
function commitHtml(row: Extract<GraphRow, { type: "commit" }>, first: boolean, last: boolean) {
  const c = row.commit;
  const head = first ? '<span class="tk-d">(</span><span class="tk-p">HEAD -&gt; main</span><span class="tk-d">)</span> ' : "";
  const subject = escapeHtml(`${c.title} at ${c.company} (${c.start}–${c.end})`);
  const span = first ? "log-lane-below" : last ? "log-lane-above" : "";
  const lanes = row.lanes
    .map((b, i) => `<span class="log-lane ${span} ${laneColor[b]}" style="left:${i * 2}ch"></span>`)
    .join("");
  return `${lanes}<span class="log-commit whitespace-pre max-sm:whitespace-pre-wrap max-sm:pl-[10ch] max-sm:-indent-[10ch]">${lanesHtml(row.lanes, c.branch)}<span class="tk-n">${c.hash}</span> ${head}${subject}</span>`;
}

function CommitRow({ row, first, last }: { row: Extract<GraphRow, { type: "commit" }>; first: boolean; last: boolean }) {
  const c = row.commit;
  const nodeY = LINE * 2 + LINE / 2;
  const id = `role-${c.hash}`;
  return (
    <Layered
      as="article"
      labelledBy={id}
      page={
        <div className="wrap relative py-10" data-branch-hover={c.branch}>
          <div aria-hidden="true">
            {row.lanes.map((b) => (
              <Lane
                key={b}
                branch={b}
                top={first && b === "main" ? nodeY : 0}
                bottom={last && b === "main" ? `calc(100% - ${nodeY}px)` : 0}
              />
            ))}
            <Node branch={c.branch} y={nodeY} />
            <span className="absolute inset-y-0 left-0 w-12" data-lens-target />
          </div>
          <div className="graph-row-text col-span-12 grid gap-x-6 pl-14 md:grid-cols-[1fr_auto] lg:col-span-10" data-branch={c.branch}>
            <h3 id={id} className="text-[1.25rem] font-semibold leading-[1.3] md:col-start-1" style={{ fontStretch: "106%" }} data-lens-target>
              {c.title} <span className="font-normal text-slate">at {c.company}</span>
            </h3>
            <p className="t-small text-slate tabular-nums max-md:order-first max-md:mb-1 md:col-start-2 md:row-start-1 md:pt-0.5" data-lens-target>
              {dates(c.start, c.end)}
            </p>
            <p className="measure mt-2 md:col-span-2">{c.impact}</p>
          </div>
        </div>
      }
      source={
        <div className="wrap relative h-full py-10">
          <pre
            className="src-pre absolute inset-0 overflow-hidden text-[15px] leading-[20px] max-sm:text-[12px]"
            dangerouslySetInnerHTML={{ __html: commitHtml(row, first, last) }}
          />
        </div>
      }
    />
  );
}

function MergeRow({ row }: { row: Extract<GraphRow, { type: "merge" }> }) {
  return (
    <Layered
      page={
        <div className="wrap relative h-10" aria-hidden="true">
          <Lane branch="main" />
          <Curve branch={row.branch} height={40} d={`M${LANE(0)} 10 C ${LANE(0)} 30, ${LANE(1)} 20, ${LANE(1)} 40`} />
          <Node branch="main" y={10} hollow />
          <span className="absolute inset-y-0 left-0 w-12" data-lens-target />
        </div>
      }
      source={
        <div className="wrap relative h-10">
          <pre
            className="src-pre absolute inset-0 text-[15px] leading-[20px] max-sm:text-[12px]"
            dangerouslySetInnerHTML={{
              __html:
                line(`<span class="tk-p">*</span>   <span class="tk-n">${row.hash}</span> ${escapeHtml(row.message)}`, "whitespace-pre max-sm:truncate") +
                line(`<span class="tk-p">|</span><span class="${laneColor[row.branch]}">\\</span>`),
            }}
          />
        </div>
      }
    />
  );
}

function ForkRow({ row }: { row: Extract<GraphRow, { type: "fork" }> }) {
  return (
    <Layered
      page={
        <div className="wrap relative h-5" aria-hidden="true">
          <Lane branch="main" />
          <Curve branch={row.branch} height={20} d={`M${LANE(1)} 0 C ${LANE(1)} 12, ${LANE(0)} 8, ${LANE(0)} 20`} />
          <span className="absolute inset-y-0 left-0 w-12" data-lens-target />
        </div>
      }
      source={
        <div className="wrap relative h-5">
          <pre
            className="src-pre absolute inset-0 text-[15px] leading-[20px] max-sm:text-[12px]"
            dangerouslySetInnerHTML={{ __html: `<span class="tk-p">|</span><span class="${laneColor[row.branch]}">/</span>` }}
          />
        </div>
      }
    />
  );
}

export function Experience() {
  const commits = experience.filter((r) => r.type === "commit");
  return (
    <section id="experience" aria-labelledby="experience-title" className="experience">
      <Layered
        page={
          <div className="wrap pb-[clamp(32px,4vw,56px)] pt-[var(--section-space)]">
            <h2 id="experience-title" tabIndex={-1} className="t-h2 col-span-12">
              {sections.experience.title}
            </h2>
            <p className="measure col-span-12 mt-6 text-slate md:col-span-8 lg:col-span-6">
              {sections.experience.intro}
            </p>
          </div>
        }
        source={
          <div className="wrap pb-[clamp(32px,4vw,56px)] pt-[var(--section-space)]">
            <p className="tk-c col-span-12">{"// the same history, from the terminal"}</p>
            <pre className="src-pre col-span-12 mt-2 text-[15px] leading-[20px]">
              <span className="tk-d">$ </span>
              <span className="tk-k">git</span> log --graph --oneline
            </pre>
          </div>
        }
      />
      {experience.map((row, i) => {
        if (row.type === "merge") return <MergeRow key={row.hash} row={row} />;
        if (row.type === "fork") return <ForkRow key={`fork-${i}`} row={row} />;
        return (
          <CommitRow
            key={row.commit.hash}
            row={row}
            first={row === commits[0]}
            last={row === commits[commits.length - 1]}
          />
        );
      })}
      <Layered page={<div className="h-[var(--section-space)]" />} source={null} />
    </section>
  );
}
