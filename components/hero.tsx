import { hero, person } from "@/content/site";
import { Code } from "@/lib/highlight";

import { Layered } from "./layered";
import { HeroMeasure } from "./hero-measure";
import { RestingLens } from "./lens";

const HEADLINE_JSX = `<h1 className="hero">
  {person.name} builds reliable checkout
  and payment systems for fast-growing fintech teams.
</h1>`;

const LEDE_JSX = `<p className="lede">
  Senior engineer at {person.company}. Open to new roles from {person.availableFrom}.
</p>
<p className="hint">{hint}</p>`;

/** A measured value from the live page, filled in by HeroMeasure. */
function M({ k, fallback }: { k: string; fallback: string }) {
  return (
    <span data-m={k} className="measure-value">
      {fallback}
    </span>
  );
}

export function Hero() {
  return (
    <Layered
      as="section"
      id="top"
      labelledBy="hero-title"
      className="hero"
      page={
        <div className="wrap pb-[var(--section-space)] pt-[var(--hero-pt)]">
          <h1
            id="hero-title"
            className="t-hero hero-title col-span-12 lg:col-span-11"
            data-lens-target
            data-lens-extend="56"
          >
            {hero.headline}
          </h1>
          <p className="t-lede col-span-12 md:col-span-9 lg:col-span-7">{hero.status}</p>
          <p className="col-span-12 mt-3 text-slate md:col-span-9 lg:col-span-7">
            <span className="hint-pointer">{hero.hintPointer}</span>
            <span className="hint-touch">{hero.hintTouch}</span>
          </p>
        </div>
      }
      source={
        <div className="wrap relative pb-[var(--section-space)] pt-[var(--hero-pt)]">
          <p className="tk-c absolute left-0 top-[calc(var(--hero-pt)-112px)] max-md:hidden">{"// app/page.tsx"}</p>

          <div className="hero-inspect col-span-12 lg:col-span-11">
            <div className="t-hero hero-title invisible" aria-hidden="true">
              {hero.headline}
            </div>

            <span className="bm-guides" />
            <span className="bm-margin" />
            <span className="bm-padding" />
            <span className="bm-content">
              <span className="bm-lines" />
              <Code code={HEADLINE_JSX} lang="tsx" className="hero-code" />
            </span>

            <span className="inspector-tip absolute bottom-[calc(100%+10px)] left-0">
              <span>
                <span className="tk-k">h1</span>
                <span className="tk-p">.hero</span>
              </span>
              <span className="tk-d">
                <M k="w" fallback="1104" /> × <M k="h" fallback="352" />
              </span>
            </span>

            <span className="redline redline-lh" aria-hidden="true">
              <span className="redline-label">
                line-height 0.95 = <M k="lh" fallback="83.6px" />
              </span>
            </span>
            <span className="redline redline-cap" aria-hidden="true">
              <span className="redline-label">
                font-size <M k="fs" fallback="88px" />, cap height 0.729em
              </span>
            </span>
            <span className="redline-note" aria-hidden="true">
              {"tracking −0.02em, wdth 112, wght 650"}
            </span>

            <div className="box-model" aria-hidden="true">
              <div className="box-model-margin">
                <span className="box-model-name">margin</span>
                <span className="box-model-top">–</span>
                <div className="box-model-border">
                  <span className="box-model-name">border</span>
                  <span className="box-model-top">–</span>
                  <div className="box-model-padding">
                    <span className="box-model-name">padding</span>
                    <span className="box-model-top">
                      <M k="pt" fallback="8" />
                    </span>
                    <div className="box-model-content">
                      <M k="w" fallback="1104" /> × <M k="ch" fallback="336" />
                    </div>
                    <span className="box-model-bottom">
                      <M k="pb" fallback="8" />
                    </span>
                  </div>
                  <span className="box-model-bottom">–</span>
                </div>
                <span className="box-model-bottom">
                  <M k="mb" fallback="44" />
                </span>
              </div>
            </div>

            <p className="hero-secret tk-c">
              {`// ${hero.secret} `}
              <a href={`mailto:${person.email}`} tabIndex={-1}>
                {person.email}
              </a>
            </p>
          </div>

          <Code
            code={LEDE_JSX}
            lang="tsx"
            wrap
            className="col-span-12 text-[13px] leading-[18px] md:col-span-9 lg:col-span-7"
          />
        </div>
      }
    >
      <RestingLens />
      <HeroMeasure />
    </Layered>
  );
}
