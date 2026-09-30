/*
 * A deliberately small highlighter for the Source layer. The four token
 * colors are the inspector's box-model colors:
 *   keywords, tags      margin   (tk-k)
 *   strings             padding  (tk-s)
 *   numbers, literals   border   (tk-n)
 *   names, properties   content  (tk-p)
 * Comments use the comment grey in Monaspace Radon (tk-c).
 * URLs, email addresses and site paths inside code become working links.
 *
 * It returns HTML strings rather than React elements: Source layers hold
 * thousands of tokens that never change, and as plain markup React doesn't
 * have to hydrate any of them.
 */

export type Lang = "ts" | "tsx" | "go" | "sql" | "json" | "bash" | "text";

const KEYWORDS: Partial<Record<Lang, RegExp>> = {
  ts: /^(import|from|export|default|const|let|function|async|await|return|if|else|new|type|as|satisfies)$/,
  tsx: /^(import|from|export|default|const|let|function|async|await|return|if|else|new|type|as)$/,
  go: /^(func|return|if|nil|package|import|type|struct|var|const|for|range|defer|err|error)$/,
  sql: /^(select|from|where|and|or|as|create|materialized|view|engine|order|by|group|insert|into|values|on|conflict|do|nothing|explain|analyze)$/i,
  bash: /^(curl|git|npm|node|k6|autocannon|open)$/,
};

const LITERALS = /^(true|false|null|undefined|nil)$/;

const RULES = {
  comment: /^(\/\/[^\n]*|--[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)/,
  string: /^("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`)/,
  number: /^(\$?\d[\d,._]*(?:\.\d+)?(?:\s?(?:ms|s|KB|MB|%))?)\b/,
  word: /^[A-Za-z_$][\w$]*/,
  space: /^\s+/,
  punct: /^[^\sA-Za-z_$\d"'`]+?(?=[\sA-Za-z_$\d"'`]|$)|^./,
};

type Token = { cls: string; text: string };

function isComment(text: string, lang: Lang) {
  if (text.startsWith("#")) return lang === "bash";
  if (text.startsWith("--")) return lang === "sql";
  if (text.startsWith("//")) return lang !== "bash";
  return true;
}

function tokenize(code: string, lang: Lang): Token[] {
  const out: Token[] = [];
  const kw = KEYWORDS[lang];
  let rest = code;
  let prev = "";

  while (rest.length) {
    let m: RegExpMatchArray | null;
    let cls = "";
    if ((m = rest.match(RULES.comment)) && isComment(m[0], lang)) {
      cls = "tk-c";
    } else if ((m = rest.match(RULES.string))) {
      const isKey = (lang === "json" || lang === "ts" || lang === "tsx") && /^\s*:/.test(rest.slice(m[0].length));
      cls = isKey ? "tk-p" : "tk-s";
    } else if ((m = rest.match(RULES.number))) {
      cls = "tk-n";
    } else if ((m = rest.match(RULES.word))) {
      const w = m[0];
      const after = rest.slice(w.length);
      if (kw?.test(w)) cls = "tk-k";
      else if (LITERALS.test(w)) cls = "tk-n";
      else if (/^\s*\(/.test(after) || /^\s*:(?!:)/.test(after)) cls = "tk-p";
      else if (lang !== "sql" && (prev === "." || /^[A-Z]/.test(w))) cls = "tk-p";
    } else if ((m = rest.match(RULES.space))) {
      cls = "";
    } else {
      m = rest.match(RULES.punct)!;
      if (lang === "tsx" && /^(<\/?|\/?>)$/.test(m[0])) cls = "tk-d";
    }
    const text = m[0];
    const last = out[out.length - 1];
    // Merge neighbours with the same class to keep the markup small.
    if (last && last.cls === cls) last.text += text;
    else out.push({ cls, text });
    prev = text === "." ? "." : text.trim() ? text : prev;
    rest = rest.slice(text.length);
  }
  return out;
}

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const LINKABLE = /(https?:\/\/[^\s"'`)]+|[\w.+-]+@[\w-]+\.[\w.-]*\w|(?<=["'`])\/(?:work\/[\w-]+|resume\.pdf|#[\w-]+)?(?=["'`]))/g;

/** Escape text, turning URLs, email addresses and site paths into links. */
export function linkHtml(text: string) {
  let html = "";
  let last = 0;
  for (const m of text.matchAll(LINKABLE)) {
    const value = m[0];
    html += escapeHtml(text.slice(last, m.index));
    const href = value.includes("@") && !value.startsWith("http") ? `mailto:${value}` : value;
    const external = href.startsWith("http") ? ' target="_blank" rel="noreferrer"' : "";
    html += `<a href="${escapeHtml(href)}" tabindex="-1"${external}>${escapeHtml(value)}</a>`;
    last = m.index! + value.length;
  }
  return html + escapeHtml(text.slice(last));
}

/* On the Page layer, code is typeset in Mona Sans: keywords in a heavier
   weight, comments in slate, everything else plain ink. */
const PAGE_CLASS: Record<string, string> = { "tk-k": "pk", "tk-c": "pc" };

/** Highlight code into an HTML string. */
export function highlightHtml(code: string, lang: Lang = "ts", variant: "source" | "page" = "source"): string {
  if (lang === "text") return variant === "source" ? linkHtml(code) : escapeHtml(code);
  return tokenize(code, lang)
    .map(({ cls, text }) => {
      const c = variant === "source" ? cls : (PAGE_CLASS[cls] ?? "");
      const body = variant === "source" ? linkHtml(text) : escapeHtml(text);
      return c ? `<span class="${c}">${body}</span>` : body;
    })
    .join("");
}

/** A preformatted, highlighted block of code. */
export function Code({
  code,
  lang = "ts",
  variant = "source",
  className = "",
  wrap = false,
}: {
  code: string;
  lang?: Lang;
  variant?: "source" | "page";
  className?: string;
  wrap?: boolean;
}) {
  return (
    <pre
      className={`${variant === "source" ? "src-pre" : ""} ${wrap ? "src-wrap" : ""} ${className}`}
      dangerouslySetInnerHTML={{ __html: highlightHtml(code, lang, variant) }}
    />
  );
}

/** Serialize a value as a readable JS/TS object literal. */
export function toLiteral(value: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  const inner = "  ".repeat(indent + 1);
  if (Array.isArray(value)) {
    const items = value.map((v) => toLiteral(v, indent + 1));
    const flat = `[${items.join(", ")}]`;
    return flat.length <= 64 ? flat : `[\n${items.map((v) => inner + v).join(",\n")},\n${pad}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value).map(([k, v]) => {
      const key = /^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k);
      return `${inner}${key}: ${toLiteral(v, indent + 1)}`;
    });
    return `{\n${entries.join(",\n")},\n${pad}}`;
  }
  return JSON.stringify(value);
}
