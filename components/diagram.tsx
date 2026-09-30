import type { Diagram as DiagramData, DiagramNode, NodeKind } from "@/content/site";
import { escapeHtml } from "@/lib/highlight";

const W = 112; // node width in the 640 × 260 coordinate space
const H = 46; // node height

const KIND_STROKE: Record<NodeKind, string> = {
  client: "var(--insp-content)",
  service: "var(--insp-padding)",
  data: "var(--insp-border)",
  external: "var(--insp-margin)",
};

function center(n: DiagramNode) {
  return { x: n.x + W / 2, y: n.y + H / 2 };
}

/** Where the segment from a box's center toward (tx, ty) leaves the box. */
function exitPoint(n: DiagramNode, tx: number, ty: number, pad: number) {
  const c = center(n);
  const dx = tx - c.x, dy = ty - c.y;
  const sx = dx === 0 ? Infinity : (W / 2 + pad) / Math.abs(dx);
  const sy = dy === 0 ? Infinity : (H / 2 + pad) / Math.abs(dy);
  const k = Math.min(sx, sy);
  return { x: c.x + dx * k, y: c.y + dy * k };
}

/**
 * Boxes and arrows. The Source variant is colored by role (client, service,
 * data, external) and set in Monaspace; the Page variant is monochrome and
 * set in Mona Sans.
 */
export function Diagram({
  data,
  variant,
  title,
  className = "",
}: {
  data: DiagramData;
  variant: "source" | "page";
  title?: string;
  className?: string;
}) {
  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  const source = variant === "source";
  const ink = source ? "var(--code)" : "var(--ink)";
  const muted = source ? "var(--comment)" : "var(--slate)";
  const font = source ? "var(--font-mono)" : "var(--font-sans)";
  const markerId = `arrow-${variant}-${data.nodes.map((n) => n.id).join("")}`;

  return (
    <svg
      viewBox="0 0 616 260"
      className={`block h-auto w-full overflow-visible ${className}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ fontFamily: font }}
    >
      <defs>
        <marker id={markerId} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0.5 L7.5 4 L0 7.5" fill="none" stroke={muted} strokeWidth="1.3" strokeLinejoin="round" />
        </marker>
      </defs>

      {data.edges.map((e) => {
        const a = byId.get(e.from)!, b = byId.get(e.to)!;
        const ca = center(a), cb = center(b);
        const p1 = exitPoint(a, cb.x, cb.y, 2);
        const p2 = exitPoint(b, ca.x, ca.y, 4);
        const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
        const vertical = Math.abs(p2.x - p1.x) < Math.abs(p2.y - p1.y);
        return (
          <g key={`${e.from}-${e.to}`}>
            <line
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={muted}
              strokeWidth={source ? 1.2 : 1.4}
              strokeDasharray={e.dashed ? "4 4" : undefined}
              markerEnd={`url(#${markerId})`}
            />
            {e.label ? (
              <text
                x={vertical ? mx + 8 : mx}
                y={vertical ? my + 4 : my - 7}
                textAnchor={vertical ? "start" : "middle"}
                fontSize={source ? 10.5 : 11.5}
                fill={muted}
                stroke={source ? "var(--editor)" : "var(--canvas)"}
                strokeWidth={4}
                strokeLinejoin="round"
                paintOrder="stroke"
                style={source ? { fontFamily: "var(--font-hand)" } : undefined}
              >
                {e.label}
              </text>
            ) : null}
          </g>
        );
      })}

      {data.nodes.map((n) => (
        <g key={n.id}>
          <rect
            x={n.x}
            y={n.y}
            width={W}
            height={H}
            rx={source ? 3 : 10}
            fill={source ? "var(--editor)" : "var(--canvas)"}
            stroke={source ? KIND_STROKE[n.kind] : "var(--ink)"}
            strokeWidth={source ? 1.3 : n.kind === "data" ? 1.4 : 1.2}
            strokeDasharray={!source && n.kind === "external" ? "3 3" : undefined}
          />
          <text x={n.x + 10} y={n.y + 20} fontSize={source ? 12 : 13} fontWeight={source ? 500 : 600} fill={source ? KIND_STROKE[n.kind] : ink}>
            {n.label}
          </text>
          <text x={n.x + 10} y={n.y + 36} fontSize={source ? 10.5 : 11.5} fill={muted}>
            {n.detail}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** The same diagram as lines of text, for narrow screens in the Source layer. */
export function DiagramText({ data }: { data: DiagramData }) {
  const byId = new Map(data.nodes.map((n) => [n.id, n]));
  const name = (id: string) => byId.get(id)!.label.replace(/\s+/g, "-").toLowerCase();
  const html = data.edges
    .map(
      (e) =>
        `<span class="tk-p">${name(e.from)}</span><span class="tk-d"> ─${escapeHtml(e.label ?? "")}${e.dashed ? "·" : "─"}→ </span><span class="tk-p">${name(e.to)}</span>`,
    )
    .join("\n");
  return <pre className="src-pre text-[11px] leading-[18px]" dangerouslySetInnerHTML={{ __html: html }} />;
}
