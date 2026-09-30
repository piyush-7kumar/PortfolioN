import type { Metadata } from "next";

import { Layered } from "@/components/layered";
import { about, experience, person, projects, type Commit } from "@/content/site";
import { Code } from "@/lib/highlight";

export const metadata: Metadata = {
  title: "Résumé",
  description: `Résumé of ${person.name}, ${person.role.toLowerCase()}.`,
  alternates: { canonical: "/resume" },
};

const roles = experience.flatMap((r) => (r.type === "commit" ? [r.commit] : []));
const jobs = roles.filter((r) => r.title !== "BSc Computer Science");
const degree = roles.find((r) => r.title === "BSc Computer Science");
const dates = (r: Commit) => (r.end === "now" ? `${r.start} to present` : `${r.start} to ${r.end}`);
const skills = Array.from(new Set(projects.flatMap((p) => p.stack)));

/** The same résumé in the JSON Resume schema, for the Source layer. */
function resumeJson() {
  return JSON.stringify(
    {
      basics: {
        name: person.name,
        label: person.role,
        email: person.email,
        url: person.site,
        location: { city: person.location },
        profiles: [
          { network: "GitHub", url: person.links.github },
          { network: "LinkedIn", url: person.links.linkedin },
        ],
      },
      work: jobs.map((r) => ({ name: r.company, position: r.title, startDate: r.start, endDate: r.end, summary: r.impact })),
      skills: [{ name: "Engineering", keywords: skills }],
      languages: person.languages.map((language) => ({ language })),
    },
    null,
    2,
  );
}

export default function Resume() {
  return (
    <main id="main" tabIndex={-1}>
      <Layered
        as="article"
        labelledBy="resume-title"
        className="resume"
        page={
          <div className="wrap pb-[var(--section-space)] pt-[var(--hero-pt)] print:pt-0">
            <header className="col-span-12 lg:col-span-10">
              <h1 id="resume-title" className="t-h2">
                {person.name}
              </h1>
              <p className="t-lede mt-4">
                {person.role} in {person.location}. I build reliable checkout and payment systems.
              </p>
              <ul className="t-small mt-4 flex flex-wrap gap-x-6 gap-y-1 text-slate">
                {[
                  [`mailto:${person.email}`, person.email],
                  [person.site, person.site],
                  [person.links.github, person.links.github],
                  [person.links.linkedin, person.links.linkedin],
                ].map(([href, label]) => (
                  <li key={href}>
                    <a className="link" href={href}>
                      {label.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  </li>
                ))}
              </ul>
            </header>

            <section className="col-span-12 mt-14 lg:col-span-10 print:mt-7" aria-labelledby="resume-experience">
              <h2 id="resume-experience" className="t-h3">
                Experience
              </h2>
              <ol className="mt-6 space-y-6 print:mt-3 print:space-y-3">
                {jobs.map((r) => (
                  <li key={r.hash} className="resume-item">
                    <p className="flex flex-wrap justify-between gap-x-6">
                      <span className="font-semibold">
                        {r.title}, {r.company}
                      </span>
                      <span className="t-small tabular-nums text-slate">{dates(r)}</span>
                    </p>
                    <p className="measure mt-1">{r.impact}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="col-span-12 mt-14 lg:col-span-10 print:mt-7" aria-labelledby="resume-projects">
              <h2 id="resume-projects" className="t-h3">
                Selected projects
              </h2>
              <ul className="mt-6 space-y-5 print:mt-3 print:space-y-3">
                {projects.map((p) => (
                  <li key={p.slug} className="resume-item">
                    <p className="font-semibold">
                      {p.title}, {p.company}, {p.year}
                    </p>
                    <p className="measure mt-1">{p.outcome}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="col-span-12 mt-14 grid gap-10 md:grid-cols-3 lg:col-span-10 print:mt-7 print:grid-cols-3 print:gap-6" aria-label="Skills, languages and education">
              <div>
                <h2 className="t-h3">Skills</h2>
                <p className="mt-4">{skills.join(", ")}</p>
              </div>
              <div>
                <h2 className="t-h3">Languages</h2>
                <p className="mt-4">{person.languages.join(", ")}</p>
              </div>
              {degree ? (
                <div>
                  <h2 className="t-h3">Education</h2>
                  <p className="mt-4">
                    {degree.title}, {degree.company}, {degree.end}
                  </p>
                </div>
              ) : null}
            </section>

            <p className="t-small col-span-12 mt-14 text-slate print:mt-7">
              {about.principles[0]}
            </p>
          </div>
        }
        source={
          <div className="wrap pb-[var(--section-space)] pt-[var(--hero-pt)]">
            <p className="tk-c col-span-12">{"// resume.json, in the JSON Resume schema"}</p>
            <Code code={resumeJson()} lang="json" wrap className="col-span-12 mt-3 text-[13px] leading-[21px] lg:col-span-10" />
          </div>
        }
      />
    </main>
  );
}
