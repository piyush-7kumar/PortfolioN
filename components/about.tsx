
import { about, person, sections } from "@/content/site";
import { Code } from "@/lib/highlight";

import { DeferredImage } from "./deferred-image";
import { ImageFacts } from "./image-facts";
import { Layered } from "./layered";

function packageJson() {
  return JSON.stringify(
    {
      name: person.slug,
      version: `${person.yearsOfExperience}.0.0`,
      description: `${person.role}. Checkouts, ledgers and payouts.`,
      author: `${person.name} <${person.email}>`,
      homepage: person.site,
      repository: person.links.repository,
      dependencies: about.stack,
      engines: {
        timezone: person.timezone,
        languages: person.languages.join(", "),
      },
      config: {
        pageLoadBudget: "1s on a mid-range Android phone",
        moneyChanges: ["idempotency key", "dashboard", "rollback"],
        codeReviewReply: "4 working hours",
      },
    },
    null,
    2,
  );
}

const IMAGE_JSX = `<Image
  src={portrait}
  alt="${about.portrait.alt}"
  sizes="(min-width: 1024px) 384px, 100vw"
/>`;

export function About() {
  return (
    <Layered
      as="section"
      id="about"
      labelledBy="about-title"
      page={
        <div className="wrap gap-y-12 py-[var(--section-space)]">
          <div className="col-span-12 sm:col-span-8 md:col-span-6 lg:col-span-4">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2px]" data-lens-target>
              <DeferredImage
                id="portrait"
                src={about.portrait.src}
                alt={about.portrait.alt}
                sizes="(min-width: 1248px) 384px, (min-width: 1024px) 31vw, (min-width: 768px) 48vw, (min-width: 640px) 64vw, calc(100vw - 32px)"
                quality={85}
              />
            </div>
          </div>
          <div className="col-span-12 lg:col-span-7 lg:col-start-6">
            <h2 id="about-title" tabIndex={-1} className="t-h2">
              {sections.about.title}
            </h2>
            <div className="measure mt-8 space-y-5">
              {about.paragraphs.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
            <h3 className="t-h3 mt-14">{sections.about.principles}</h3>
            <ul className="measure mt-6 space-y-4">
              {about.principles.map((p) => (
                <li key={p} className="border-l border-hairline pl-5">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      }
      source={
        <div className="wrap gap-y-12 py-[var(--section-space)]">
          <div className="col-span-12 sm:col-span-8 md:col-span-6 lg:col-span-4">
            <div className="relative aspect-[4/5] overflow-hidden">
              <span className="absolute inset-0 bg-[var(--fill-content)]" />
              <span className="bm-guides" />
              <span className="inspector-tip absolute left-3 top-3">
                <span>
                  <span className="tk-k">img</span>
                  <span className="tk-p">#portrait</span>
                </span>
                <ImageFacts targetId="portrait" show="rendered" />
              </span>
              <Code code={IMAGE_JSX} lang="tsx" wrap className="absolute inset-x-3 top-16 text-[12px] leading-[19px]" />
              <div className="absolute inset-x-3 bottom-3 text-[12px] leading-[19px]">
                <p className="tk-c">{`// intrinsic ${about.portrait.src.width} × ${about.portrait.src.height}`}</p>
                <p className="tk-c">
                  {"// "}
                  <ImageFacts targetId="portrait" show="bytes" />
                </p>
                <p className="tk-c">{`// ${about.portrait.note}`}</p>
              </div>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-7 lg:col-start-6">
            <p className="tk-c">{"// package.json"}</p>
            <Code code={packageJson()} lang="json" wrap className="mt-3 text-[13px] leading-[21px]" />
          </div>
        </div>
      }
    />
  );
}
