# View Source

A portfolio for a senior full-stack engineer, built around one idea: every section has two layers.

- **Page** is the finished design: light, quiet, monochrome, set in Mona Sans.
- **Source** sits underneath: the section's code, box-model overlays, measurements, architecture diagrams and the numbers behind each claim, set in Monaspace and colored with the element inspector's box-model colors.

A clear glass lens follows the cursor over the hero, screenshots, the experience graph, the portrait and the case-study diagrams and code, and shows the Source layer underneath. Hold <kbd>Shift</kbd> to peek anywhere. The **View source** switch (or <kbd>V</kbd>) expands the lens until the whole site is its source. `?view=source` links straight to that view. <kbd>⌘</kbd><kbd>K</kbd> / <kbd>Ctrl</kbd><kbd>K</kbd> opens a command palette.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint
npm run typecheck
```

Node 20+ is required. The site is fully static apart from `POST /api/hello`.

## Make it yours

All content lives in **`content/site.ts`**: the person, hero copy, projects and their case studies, the experience graph, the About section and contact copy. Start by replacing the placeholders:

| Placeholder | Where |
| --- | --- |
| `[Your Name]`, `[Company]`, `[Month]` | `person` in `content/site.ts` |
| `hello@yourname.dev`, GitHub, LinkedIn, repository links | `person.links` |
| Project screenshots (2400 × 1500 PNG, 16:10) | `content/images/*.png` |
| Portrait (960 × 1200, 4:5) | `content/images/portrait.jpg` |
| Site URL | `NEXT_PUBLIC_SITE_URL` (see `.env.example`) |

The screenshots and portrait that ship with the repo are placeholders: mock product UIs and a silhouette. Swap in your own. Next.js serves them as AVIF or WebP at the right size.

The project URLs in the browser frames use `example.com` addresses; replace them with the real ones.

Then regenerate the derived files:

```bash
npm run build && npm start      # in one terminal
npm run resume                  # prints /resume to public/resume.pdf with headless Chrome
```

`app/opengraph-image.png` (and the identical `twitter-image.png`) is a 1200 × 630 screenshot of the hero with the lens half open. Retake it after changing the headline.

## How it's built

- **Next.js 16** (App Router, static rendering), **TypeScript**, **Tailwind CSS v4**, **Motion** for the nav marker's spring and toast transitions.
- **Layers.** `components/layered.tsx` renders a Page and a Source layer in the same grid cell. Sections are made of several layered blocks (a work row, a commit in the graph), so each Source sits directly under the thing it explains.
- **The lens** is one module, `components/lens.tsx`. A single `requestAnimationFrame` loop moves the clip circle (`clip-path: circle(var(--r) at var(--x) var(--y))`) on every visible Source layer, springs the glass that follows the cursor, runs the View source expansion and the first-visit wipe, and nudges the specular highlight on glass surfaces. It reads every rect before writing any style, and stops when nothing moves or the tab is hidden. The Contact headline's letter effect runs as a task inside the same loop.
- **Glass.** The lens refracts at its rim with an SVG displacement map in `backdrop-filter` on Chromium, and uses a blurred rim elsewhere. Nav, palette and toasts are frosted glass.
- **Source markup is plain HTML.** Syntax-highlighted code (`lib/highlight.tsx`) is rendered as HTML strings, so React doesn't hydrate thousands of token spans.
- **Screenshots** below the fold load after hydration via `components/deferred-image.tsx`, so they don't compete with fonts for the first paint.
- **Case studies** (`app/work/[slug]`) morph the screenshot into the header with React's `<ViewTransition>`.

### Fonts

Mona Sans and Monaspace (Neon for code, Radon for comments) are self-hosted from `public/fonts` as subsetted variable WOFF2 files: Mona Sans keeps its `wdth`, `wght` and `opsz` axes for a Latin subset (77 KB), with an extended-Latin file loaded only when a page needs it. Both families are under the SIL Open Font License (see `public/fonts/LICENSE-*.txt`).

## Accessibility

The Source layer is `aria-hidden`, its links are out of the tab order, and everything it shows is also on the Page (the hidden message's email address is in Contact). Focus rings stay visible in Source view, keyboard shortcuts are ignored while typing, the command palette is a native `<dialog>` with a combobox, and `prefers-reduced-motion` removes the intro, stops the lens from easing, turns View source into a crossfade and keeps the Contact headline still. Page and Source colors meet WCAG AA in both themes.

## Contact endpoint

`POST /api/hello` accepts `{ name, building, replyTo }` and forwards it to `CONTACT_WEBHOOK_URL`. Until that's set it answers `503` and points people to your email address, rather than pretending a message was delivered.

## Measured

Lighthouse 13, production build served locally:

| Page | Mobile | Desktop |
| --- | --- | --- |
| Home | 96 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |
| Case study | 95 / 100 / 100 / 100 | 100 / 100 / 100 / 100 |

(Performance / Accessibility / Best Practices / SEO; cumulative layout shift is 0 on every run.)
