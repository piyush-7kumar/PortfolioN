import type { StaticImageData } from "next/image";

import checkoutShot from "./images/checkout.png";
import ledgerShot from "./images/ledger.png";
import dashboardShot from "./images/dashboard.png";
import kitShot from "./images/idempotency-kit.png";
import portraitImage from "./images/portrait.jpg";

/*
 * Everything a visitor reads lives in this file: the person, projects, case
 * studies, roles and links. Replace the bracketed placeholders first.
 */

export type NodeKind = "client" | "service" | "data" | "external";

export type DiagramNode = {
  id: string;
  label: string;
  detail: string;
  kind: NodeKind;
  /** Top-left corner in the diagram's 640 × 260 coordinate space. */
  x: number;
  y: number;
};

export type DiagramEdge = {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
};

export type Diagram = { nodes: DiagramNode[]; edges: DiagramEdge[] };

export type Proof =
  | { kind: "table"; caption: string; columns: string[]; rows: string[][] }
  | { kind: "plan"; caption: string; query: string[]; plan: string[] }
  | { kind: "bench"; caption: string; command: string; columns: string[]; rows: string[][] };

export type CodeExcerpt = {
  filename: string;
  language: "ts" | "go" | "sql";
  caption: string;
  code: string;
};

export type Project = {
  slug: string;
  title: string;
  outcome: string;
  company: string;
  role: string;
  year: string;
  stack: string[];
  /** Shown in the browser frame's address bar. */
  url: string;
  image: { src: StaticImageData; alt: string };
  architecture: Diagram;
  proof: Proof;
  caseStudy: {
    context: string[];
    problem: string[];
    approach: string[];
    code: CodeExcerpt;
    results: string[];
  };
};

export type Branch = "main" | "freelance" | "oss";

export type Commit = {
  hash: string;
  branch: Branch;
  title: string;
  company: string;
  start: string;
  end: string;
  impact: string;
};

/** One row of the experience graph, newest first, in `git log --graph` order. */
export type GraphRow =
  | { type: "commit"; commit: Commit; lanes: Branch[] }
  | { type: "merge"; hash: string; branch: Branch; message: string }
  | { type: "fork"; branch: Branch };

export const person = {
  name: "[Your Name]",
  slug: "your-name",
  role: "Senior full-stack engineer",
  company: "[Company]",
  availableFrom: "[Month]",
  email: "hello@yourname.dev",
  location: "Berlin",
  timezone: "Europe/Berlin (UTC+1)",
  languages: ["English", "German"],
  yearsOfExperience: 9,
  site: process.env.NEXT_PUBLIC_SITE_URL ?? "https://yourname.dev",
  links: {
    github: "https://github.com/yourname",
    linkedin: "https://www.linkedin.com/in/yourname",
    resume: "/resume.pdf",
    repository: "https://github.com/yourname/portfolio",
  },
};

export const hero = {
  headline: `${person.name} builds reliable checkout and payment systems for fast-growing fintech teams.`,
  status: `Senior engineer at ${person.company}. Open to new roles from ${person.availableFrom}.`,
  hintPointer: "Move your cursor over this page to see how it's built.",
  hintTouch: "Drag the glass across the headline to see how it's built.",
  /** Only the lens finds this. The same address is on the page in Contact. */
  secret: "if you're reading this, we should talk:",
};

export const projects: Project[] = [
  {
    slug: "one-page-checkout",
    title: "One-page checkout",
    outcome:
      "Rebuilt a five-step checkout as a single page and lifted mobile conversion from 2.1% to 2.6% across 1.4 million monthly sessions.",
    company: person.company,
    role: "Tech lead, team of five",
    year: "2025",
    stack: ["Next.js", "TypeScript", "Stripe", "PostgreSQL"],
    url: "checkout.example.com",
    image: {
      src: checkoutShot,
      alt: "The one-page checkout on desktop: contact, delivery and payment on the left, order summary with two items on the right.",
    },
    architecture: {
      nodes: [
        { id: "browser", label: "Browser", detail: "138 KB of JS", kind: "client", x: 12, y: 106 },
        { id: "next", label: "Next.js", detail: "server-rendered", kind: "service", x: 172, y: 106 },
        { id: "api", label: "Checkout API", detail: "Node, idempotent", kind: "service", x: 332, y: 26 },
        { id: "db", label: "PostgreSQL", detail: "carts, orders", kind: "data", x: 332, y: 186 },
        { id: "stripe", label: "Stripe", detail: "Payment Intents", kind: "external", x: 492, y: 26 },
        { id: "queue", label: "Webhook queue", detail: "replay-safe", kind: "data", x: 492, y: 186 },
      ],
      edges: [
        { from: "browser", to: "next", label: "HTML" },
        { from: "next", to: "api", label: "RPC" },
        { from: "api", to: "db", label: "SQL" },
        { from: "api", to: "stripe", label: "intent" },
        { from: "stripe", to: "queue", label: "events" },
        { from: "queue", to: "db", label: "upsert", dashed: true },
      ],
    },
    proof: {
      kind: "table",
      caption: "Mobile field data, 28 days before and after launch",
      columns: ["", "before", "after"],
      rows: [
        ["conversion", "2.1%", "2.6%"],
        ["p75 LCP", "3.8 s", "1.2 s"],
        ["JavaScript", "412 KB", "138 KB"],
        ["duplicate charges", "31 / mo", "0"],
      ],
    },
    caseStudy: {
      context: [
        `${person.company} sells furniture online in six countries. About 1.4 million checkout sessions a month start on a phone, most of them on mid-range Android devices over mobile data.`,
        "I led a team of five engineers and one designer on checkout from January to June 2025.",
      ],
      problem: [
        "The old checkout was five client-rendered pages. Each step fetched the cart again, and the payment step shipped 412 KB of JavaScript before a shopper could type a card number.",
        "On a Moto G Power the payment form took 3.8 seconds to become usable at the 75th percentile. 41% of mobile shoppers who reached the delivery step never saw it.",
        "Retries were also unsafe. A slow network plus a second tap on Pay produced about 31 duplicate charges a month, each one a refund and a support ticket.",
      ],
      approach: [
        "We moved checkout to a single server-rendered page. Contact, delivery and payment are sections that open in order, so a shopper sees their progress without a full page load between steps.",
        "The server renders the cart once and streams the summary. Client JavaScript is limited to the address lookup and Stripe's Payment Element, which dropped the bundle from 412 KB to 138 KB.",
        "Every confirm request carries an idempotency key created when the page loads. Retries and double taps now resolve to the same payment intent instead of a new charge.",
        "We shipped behind a flag to 10%, then 50%, then everyone, keeping a 10% holdback for four weeks so the conversion number would be a comparison, not a guess.",
      ],
      code: {
        filename: "app/checkout/actions.ts",
        language: "ts",
        caption: "The confirm action. One key per checkout attempt makes retries safe.",
        code: `export async function confirmOrder(cartId: string, key: string) {
  // Retries and double taps arrive with the same key.
  const existing = await db.paymentAttempt.findUnique({ where: { key } });
  if (existing) return existing;

  const cart = await db.cart.lockForCheckout(cartId);
  const intent = await stripe.paymentIntents.create(
    { amount: cart.totalMinor, currency: cart.currency, metadata: { cartId } },
    { idempotencyKey: key },
  );

  return db.paymentAttempt.create({
    data: { key, cartId, intentId: intent.id, status: intent.status },
  });
}`,
      },
      results: [
        "Mobile conversion rose from 2.1% to 2.6% over the 28 days after launch, measured against the 10% holdback.",
        "The payment form became usable in 1.2 seconds at the 75th percentile, down from 3.8 seconds.",
        "Duplicate charges went from about 31 a month to zero, and checkout support tickets fell by a third.",
      ],
    },
  },
  {
    slug: "payout-ledger",
    title: "Exactly-once payout ledger",
    outcome:
      "Replaced nightly batch payouts with a double-entry ledger that has paid out $1.9 billion without a single double payment.",
    company: "Tessellate Payments",
    role: "Backend lead",
    year: "2023",
    stack: ["Go", "PostgreSQL", "Kafka"],
    url: "payouts.example.com",
    image: {
      src: ledgerShot,
      alt: "The payouts operations screen: a balance summary above a table of today's payout batches and their settlement status.",
    },
    architecture: {
      nodes: [
        { id: "api", label: "Payments API", detail: "writes the outbox", kind: "service", x: 12, y: 26 },
        { id: "outbox", label: "Outbox", detail: "same transaction", kind: "data", x: 172, y: 26 },
        { id: "kafka", label: "Kafka", detail: "transfer events", kind: "data", x: 332, y: 26 },
        { id: "ledger", label: "Ledger writer", detail: "Go, exactly-once", kind: "service", x: 492, y: 26 },
        { id: "entries", label: "Entries", detail: "append-only", kind: "data", x: 492, y: 186 },
        { id: "payout", label: "Payout worker", detail: "batches by bank", kind: "service", x: 332, y: 186 },
        { id: "bank", label: "Bank rails", detail: "SEPA, ACH", kind: "external", x: 172, y: 186 },
        { id: "recon", label: "Reconciler", detail: "daily, automated", kind: "service", x: 12, y: 186 },
      ],
      edges: [
        { from: "api", to: "outbox", label: "tx" },
        { from: "outbox", to: "kafka", label: "relay" },
        { from: "kafka", to: "ledger", label: "consume" },
        { from: "ledger", to: "entries", label: "2 legs" },
        { from: "entries", to: "payout", label: "balances" },
        { from: "payout", to: "bank", label: "files" },
        { from: "bank", to: "recon", label: "statements" },
      ],
    },
    proof: {
      kind: "plan",
      caption: "Balance lookup on 1.2 billion entries. Before the covering index it was a 1.9 s scan.",
      query: [
        "EXPLAIN ANALYZE SELECT sum(amount_minor) FROM entries",
        "WHERE account_id = $1 AND posted_at < $2;",
      ],
      plan: [
        "Aggregate  (actual time=0.452..0.453 rows=1 loops=1)",
        "  ->  Index Only Scan using entries_account_posted_idx on entries",
        "        (actual time=0.031..0.412 rows=1204 loops=1)",
        "        Heap Fetches: 0",
        "Planning Time: 0.118 ms",
        "Execution Time: 0.463 ms",
      ],
    },
    caseStudy: {
      context: [
        "Tessellate Payments pays out marketplace sellers across Europe and the US. When I joined in 2021 it moved about $40 million a month to 18,000 sellers.",
        "I was the backend lead for payouts, working with two other engineers and the finance operations team.",
      ],
      problem: [
        "Payouts ran as one nightly batch job that read balances from a mutable table. If the job failed halfway, someone reran it by hand.",
        "In March 2022 a rerun paid 14 sellers twice. Getting the money back took five weeks. Reconciliation against bank statements took two analysts three days every month.",
      ],
      approach: [
        "We replaced the balances table with a double-entry ledger. Every transfer writes two entries that sum to zero, and entries are never updated or deleted.",
        "Services publish transfer events through a transactional outbox, so an event exists only if the business change committed. The ledger writer uses the event ID as a primary key, which makes a replayed event a no-op.",
        "Payouts are computed from ledger balances in small batches through the day. A reconciler matches every bank statement line to a ledger entry each morning and opens a ticket for anything left over.",
      ],
      code: {
        filename: "ledger/post.go",
        language: "go",
        caption: "Posting a transfer. The event ID is the primary key, so a replay does nothing.",
        code: `func (l *Ledger) Post(ctx context.Context, ev TransferEvent) error {
	return l.db.Tx(ctx, func(tx *sql.Tx) error {
		res, err := tx.ExecContext(ctx,
			\`INSERT INTO transfers (event_id, amount_minor, currency)
			 VALUES ($1, $2, $3) ON CONFLICT (event_id) DO NOTHING\`,
			ev.ID, ev.AmountMinor, ev.Currency)
		if err != nil {
			return err
		}
		if n, _ := res.RowsAffected(); n == 0 {
			return nil // already posted
		}
		return insertLegs(ctx, tx, ev)
	})
}`,
      },
      results: [
        "The ledger has paid out $1.9 billion since launch with zero double payments.",
        "Monthly reconciliation went from three analyst-days to a 20-minute review of an automated report.",
        "Sellers are paid the next business day instead of in three to five days.",
      ],
    },
  },
  {
    slug: "merchant-dashboard",
    title: "Merchant reporting dashboard",
    outcome:
      "Cut the dashboard's p95 load time from 6.2 s to 0.9 s by moving reports onto pre-aggregated rollups.",
    company: "Harbor & Lane",
    role: "Full-stack engineer",
    year: "2021",
    stack: ["React", "Node.js", "ClickHouse"],
    url: "merchants.example.com",
    image: {
      src: dashboardShot,
      alt: "The merchant dashboard: revenue for the last 30 days as a line chart, three summary figures and a table of recent orders.",
    },
    architecture: {
      nodes: [
        { id: "browser", label: "Dashboard", detail: "React", kind: "client", x: 12, y: 106 },
        { id: "api", label: "Reports API", detail: "Node, cached", kind: "service", x: 172, y: 106 },
        { id: "redis", label: "Redis", detail: "60 s TTL", kind: "data", x: 172, y: 206 },
        { id: "ch", label: "ClickHouse", detail: "hourly rollups", kind: "data", x: 332, y: 106 },
        { id: "kafka", label: "Kafka", detail: "change stream", kind: "data", x: 492, y: 106 },
        { id: "pg", label: "Orders DB", detail: "PostgreSQL", kind: "data", x: 492, y: 6 },
      ],
      edges: [
        { from: "browser", to: "api", label: "JSON" },
        { from: "api", to: "redis", label: "cache" },
        { from: "api", to: "ch", label: "SQL" },
        { from: "pg", to: "kafka", label: "CDC" },
        { from: "kafka", to: "ch", label: "rollup" },
      ],
    },
    proof: {
      kind: "bench",
      caption: "k6, 200 virtual users for 10 minutes against a production-sized copy",
      command: "k6 run --vus 200 --duration 10m reports.js",
      columns: ["/reports/revenue", "p50", "p95", "p99"],
      rows: [
        ["before", "2.4 s", "6.2 s", "9.8 s"],
        ["after", "180 ms", "910 ms", "1.3 s"],
      ],
    },
    caseStudy: {
      context: [
        "Harbor & Lane runs a marketplace for independent homeware shops. About 22,000 merchants use its dashboard to see sales, refunds and payouts.",
        "I worked on it as a full-stack engineer from 2019 to 2021, owning reporting end to end.",
      ],
      problem: [
        "Every report was computed on request from the raw orders table in PostgreSQL. It worked for small shops, but the largest merchants waited up to ten seconds for a revenue chart.",
        "At month-end, when everyone exported reports at once, the dashboard timed out about 1,100 times a month and slowed checkout, because both shared the same database.",
      ],
      approach: [
        "We streamed changes from the orders database into Kafka and built hourly rollups in ClickHouse with materialized views, so a report reads a few thousand pre-summed rows instead of millions of orders.",
        "The reports API caches each merchant's query for 60 seconds in Redis and serves the chart shell immediately, so the page never waits on the slowest widget.",
        "We ran old and new pipelines side by side for three weeks and compared every merchant's totals daily until they matched to the cent.",
      ],
      code: {
        filename: "rollups/revenue_by_hour.sql",
        language: "sql",
        caption: "The hourly rollup. Reports sum these rows instead of scanning orders.",
        code: `CREATE MATERIALIZED VIEW revenue_by_hour
ENGINE = SummingMergeTree
ORDER BY (merchant_id, hour, currency)
AS SELECT
  merchant_id,
  toStartOfHour(created_at) AS hour,
  currency,
  sum(amount_minor) AS gross_minor,
  count() AS orders
FROM orders_stream
GROUP BY merchant_id, hour, currency;`,
      },
      results: [
        "The dashboard's p95 load time fell from 6.2 seconds to 0.9 seconds.",
        "Month-end timeouts went from about 1,100 a month to none.",
        "Peak CPU on the orders database dropped from 78% to 31%, which also made checkout faster at month-end.",
      ],
    },
  },
  {
    slug: "idempotency-kit",
    title: "idempotency-kit",
    outcome:
      "An open-source idempotency-key middleware for Node APIs with 41,000 weekly downloads, adding 0.4 ms at p99.",
    company: "Open source",
    role: "Author and maintainer",
    year: "2021",
    stack: ["TypeScript", "Redis", "PostgreSQL"],
    url: "github.com/yourname/idempotency-kit",
    image: {
      src: kitShot,
      alt: "The idempotency-kit documentation site: a getting-started guide with an install command and a short code example.",
    },
    architecture: {
      nodes: [
        { id: "client", label: "Client", detail: "Idempotency-Key", kind: "client", x: 12, y: 106 },
        { id: "mw", label: "idempotency()", detail: "middleware", kind: "service", x: 202, y: 106 },
        { id: "handler", label: "Your handler", detail: "runs once", kind: "service", x: 482, y: 26 },
        { id: "store", label: "Store", detail: "Redis or Postgres", kind: "data", x: 482, y: 186 },
      ],
      edges: [
        { from: "client", to: "mw", label: "POST" },
        { from: "mw", to: "handler", label: "first request" },
        { from: "handler", to: "store", label: "save response" },
        { from: "store", to: "mw", label: "replay", dashed: true },
      ],
    },
    proof: {
      kind: "bench",
      caption: "autocannon, 100 connections for 30 s on an M2 laptop, Redis store",
      command: "autocannon -c 100 -d 30 localhost:3000/charges",
      columns: ["", "p50", "p99", "req/s"],
      rows: [
        ["baseline", "1.9 ms", "4.1 ms", "48,210"],
        ["with kit", "2.1 ms", "4.5 ms", "46,890"],
      ],
    },
    caseStudy: {
      context: [
        "I wrote idempotency-kit in 2021 after the double payout at Tessellate, because every Node service we had was solving the same problem slightly differently.",
        "It is MIT licensed, has two co-maintainers, and is used by more than 300 public projects.",
      ],
      problem: [
        "Payment APIs need retries to be safe: if a client times out and sends the same request again, the server should return the first result instead of doing the work twice.",
        "Most teams add a unique key check in a handler, which misses concurrent duplicates that arrive a few milliseconds apart and doesn't handle a changed request body reusing an old key.",
      ],
      approach: [
        "The middleware takes a lock on the key before the handler runs, so concurrent duplicates wait instead of racing.",
        "It stores a fingerprint of the request with the key. The same key with a different body is rejected with a 422, which catches client bugs early.",
        "Stores are small adapters. Redis and PostgreSQL ship in the box, and the interface is four methods, so teams can bring their own.",
      ],
      code: {
        filename: "examples/express.ts",
        language: "ts",
        caption: "Protecting a route. Everything else is configuration.",
        code: `import { idempotency, redisStore } from "idempotency-kit";

app.post(
  "/charges",
  idempotency({
    store: redisStore(redis),
    ttl: "24h",
    fingerprint: (req) => [req.method, req.path, req.body],
  }),
  createCharge,
);`,
      },
      results: [
        "41,000 weekly downloads and more than 300 dependent public projects.",
        "In the benchmark above it adds 0.2 ms at the median and 0.4 ms at p99.",
        "At least 12 companies run it in production for payment endpoints, including two of my former employers.",
      ],
    },
  },
];

const roles = {
  current: {
    hash: "7c1e9a2",
    branch: "main",
    title: "Senior engineer",
    company: person.company,
    start: "2024",
    end: "now",
    impact: "Lead the checkout team of five. Shipped the one-page checkout that lifted mobile conversion from 2.1% to 2.6%.",
  },
  oss: {
    hash: "e52a7c1",
    branch: "oss",
    title: "Author",
    company: "idempotency-kit, open source",
    start: "2021",
    end: "2023",
    impact: "Wrote and released 1.0 of an idempotency middleware that now has 41,000 weekly downloads.",
  },
  tessellate: {
    hash: "91f0b6d",
    branch: "main",
    title: "Senior backend engineer",
    company: "Tessellate Payments",
    start: "2021",
    end: "2024",
    impact: "Designed the double-entry ledger behind $1.9 billion in payouts, with zero double payments.",
  },
  harbor: {
    hash: "3a6c2e8",
    branch: "main",
    title: "Full-stack engineer",
    company: "Harbor & Lane",
    start: "2019",
    end: "2021",
    impact: "Rebuilt merchant reporting on ClickHouse and took p95 load time from 6.2 s to 0.9 s.",
  },
  freelance: {
    hash: "8e3b1f4",
    branch: "freelance",
    title: "Freelance payments engineer",
    company: "Independent",
    start: "2018",
    end: "2019",
    impact: "Built Stripe and Adyen integrations for three independent shops, evenings and weekends.",
  },
  brightloop: {
    hash: "2d7a5c9",
    branch: "main",
    title: "Software engineer",
    company: "Brightloop Studio",
    start: "2017",
    end: "2019",
    impact: "Built storefronts for 20 retailers and the component library the studio still uses.",
  },
  degree: {
    hash: "f3e0a11",
    branch: "main",
    title: "BSc Computer Science",
    company: "University",
    start: "2013",
    end: "2017",
    impact: "Final-year project: a fraud-scoring prototype for card payments, graded first class.",
  },
} satisfies Record<string, Commit>;

export const experience: GraphRow[] = [
  { type: "commit", commit: roles.current, lanes: ["main"] },
  { type: "merge", hash: "4b8d3f0", branch: "oss", message: "Merge branch 'oss/idempotency-kit'" },
  { type: "commit", commit: roles.oss, lanes: ["main", "oss"] },
  { type: "commit", commit: roles.tessellate, lanes: ["main", "oss"] },
  { type: "fork", branch: "oss" },
  { type: "commit", commit: roles.harbor, lanes: ["main"] },
  { type: "merge", hash: "c0d94b7", branch: "freelance", message: "Merge branch 'freelance'" },
  { type: "commit", commit: roles.freelance, lanes: ["main", "freelance"] },
  { type: "commit", commit: roles.brightloop, lanes: ["main", "freelance"] },
  { type: "fork", branch: "freelance" },
  { type: "commit", commit: roles.degree, lanes: ["main"] },
];

export const about = {
  portrait: {
    src: portraitImage,
    alt: `Portrait of ${person.name}, head and shoulders, in natural window light.`,
    note: "no filters, no retouching",
  },
  paragraphs: [
    `I'm a ${person.role.toLowerCase()} in ${person.location}. For nine years I've worked on the parts of products where money changes hands: checkouts, ledgers, payouts and the reports merchants use to check them.`,
    "I like problems where you can tell whether you were right. A checkout converts or it doesn't; a ledger balances or it pages someone. So I measure before I change things, and most of my pull requests come with a number.",
    "Outside work I maintain idempotency-kit, mentor two junior engineers through a local bootcamp, and spend most weekends somewhere without phone signal.",
  ],
  principles: [
    "Every page I ship loads in under a second on a mid-range Android phone.",
    "Every change that moves money ships with an idempotency key, a dashboard and a way to roll it back.",
    "I reply to code review requests within four working hours, so nobody's work waits on me.",
  ],
  stack: {
    typescript: "^5.9",
    react: "^19",
    next: "^16",
    node: "^22",
    go: "^1.25",
    postgresql: "^17",
    kafka: "^3.9",
    clickhouse: "^25",
  },
};

/** Section headings and the sentence under each. */
export const sections = {
  work: {
    title: "Selected work",
    intro: "Four projects from the last six years, with the numbers that show whether they worked.",
  },
  experience: {
    title: "Experience",
    intro: "Nine years, most of them on payments. Newest first, drawn the way git would draw it.",
  },
  about: { title: "About", principles: "How I work" },
  caseStudy: {
    architecture:
      "Boxes with a solid outline are services we ran, heavier outlines hold data, and dashed boxes belong to someone else.",
  },
};

export const contact = {
  headline: "Tell me what you're building.",
  body: "Email is the quickest way to reach me. I reply within one working day.",
  replyWithin: "1 working day",
};
