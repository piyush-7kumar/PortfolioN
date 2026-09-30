import type { Proof as ProofData } from "@/content/site";
import { escapeHtml, highlightHtml } from "@/lib/highlight";

const span = (cls: string, text: string) => (cls ? `<span class="${cls}">${escapeHtml(text)}</span>` : escapeHtml(text));

/** A query plan with its timings picked out. */
function planHtml(lines: string[]) {
  return lines
    .map((line, i) =>
      line
        .split(/(\d[\d.]*(?:\.\.\d[\d.]*)?(?: ms)?)/)
        .map((part, j) => span(j % 2 ? "tk-n" : i === 1 && j === 0 ? "tk-p" : "", part))
        .join(""),
    )
    .join("\n");
}

/** A results table, padded into columns the way a terminal prints it. */
function tableHtml(proof: Extract<ProofData, { kind: "table" | "bench" }>) {
  const widths = proof.columns.map((c, i) => Math.max(c.length, ...proof.rows.map((r) => (r[i] ?? "").length)));
  const pad = (text: string, i: number) => (i === 0 ? text.padEnd(widths[i]) : text.padStart(widths[i]));
  const head = span("tk-d", proof.columns.map(pad).join("   "));
  const rows = proof.rows.map((row) =>
    row
      .map((cell, i) => span(i === 0 ? "tk-p" : i === row.length - 1 && proof.kind === "table" ? "tk-n" : "", pad(cell, i)))
      .join("   "),
  );
  return [head, ...rows].join("\n");
}

/** The numbers behind a project's outcome, as they came out of the tool. */
export function Proof({ proof, compact = false }: { proof: ProofData; compact?: boolean }) {
  const size = compact ? "text-[11px] leading-[17px]" : "text-[12.5px] leading-[20px]";
  return (
    <div className={size}>
      <p className="src-caption src-wrap">{`// ${proof.caption}`}</p>
      {proof.kind === "plan" ? (
        <>
          <pre className="src-pre src-wrap mt-1.5" dangerouslySetInnerHTML={{ __html: highlightHtml(proof.query.join("\n"), "sql") }} />
          <pre className="src-pre mt-1.5 overflow-hidden" dangerouslySetInnerHTML={{ __html: planHtml(proof.plan) }} />
        </>
      ) : (
        <>
          {proof.kind === "bench" ? (
            <pre
              className="src-pre src-wrap mt-1.5"
              dangerouslySetInnerHTML={{ __html: `<span class="tk-d">$ </span>${highlightHtml(proof.command, "bash")}` }}
            />
          ) : null}
          <pre className="src-pre mt-1.5" dangerouslySetInnerHTML={{ __html: tableHtml(proof) }} />
        </>
      )}
    </div>
  );
}
