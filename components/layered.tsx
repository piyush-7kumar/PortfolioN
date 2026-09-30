import type { ReactNode } from "react";

/**
 * A block with two layers in one grid cell: the Page layer people read, and
 * the Source layer underneath it, which the lens reveals. The Source layer is
 * hidden from assistive technology; nothing important may live only there.
 */
export function Layered({
  id,
  as: Tag = "div",
  labelledBy,
  className = "",
  page,
  source,
  children,
}: {
  id?: string;
  as?: "div" | "section" | "header" | "footer" | "article";
  labelledBy?: string;
  className?: string;
  page: ReactNode;
  source: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Tag id={id} aria-labelledby={labelledBy} className={`layered ${className}`}>
      <div className="layer-page">{page}</div>
      <div className="layer-source" aria-hidden="true">
        {source}
      </div>
      {children}
    </Tag>
  );
}
