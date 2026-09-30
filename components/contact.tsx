import { contact, person } from "@/content/site";
import { Code, highlightHtml } from "@/lib/highlight";

import { ContactHeadline } from "./contact-headline";
import { CopyEmailButton } from "./copy-email";
import { Layered } from "./layered";

const CURL = `$ curl -X POST ${person.site}/api/hello \\
    -H "Content-Type: application/json" \\
    -d '{
      "name": "Your name",
      "building": "What you're building",
      "replyTo": "your email address"
    }'`;

const RESPONSE = `{
  "ok": true,
  "reply": "within ${contact.replyWithin}",
  "from": "${person.email}"
}`;

export function Contact() {
  const links = [
    { href: person.links.github, label: "GitHub" },
    { href: person.links.linkedin, label: "LinkedIn" },
    { href: person.links.resume, label: "Résumé (PDF)" },
  ];
  return (
    <Layered
      as="section"
      id="contact"
      labelledBy="contact-title"
      page={
        <div className="wrap pb-[clamp(96px,12vw,160px)] pt-[var(--section-space)]">
          <div className="col-span-12 lg:col-span-11">
            <ContactHeadline id="contact-title" text={contact.headline} />
          </div>
          <p className="t-lede measure col-span-12 mt-8 md:col-span-9 lg:col-span-7">{contact.body}</p>
          <div className="col-span-12 mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
            <CopyEmailButton />
            <a href={`mailto:${person.email}`} className="link t-lede">
              {person.email}
            </a>
          </div>
          <ul className="col-span-12 mt-12 flex flex-wrap gap-x-8 gap-y-3">
            {links.map((l) => (
              <li key={l.label}>
                <a href={l.href} className="link" {...(l.href.startsWith("http") ? { rel: "me" } : {})}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      }
      source={
        <div className="wrap pb-[clamp(96px,12vw,160px)] pt-[var(--section-space)]">
          <div className="col-span-12 text-[clamp(13px,1.35vw,16px)] leading-[1.6] lg:col-span-10">
            <p className="tk-c">{"// no form, no tracking: this is the whole contact flow"}</p>
            <Code code={CURL} lang="bash" wrap className="mt-3" />
            <pre
              className="src-pre mt-6"
              dangerouslySetInnerHTML={{
                __html: `<span class="tk-k">HTTP/2</span> <span class="tk-n">200</span>\n<span class="tk-p">content-type</span>: application/json\n\n${highlightHtml(RESPONSE, "json")}`,
              }}
            />
            <p className="tk-c mt-6">{"// or skip the terminal:"}</p>
            <Code
              code={links.map((l) => `open "${l.href.startsWith("http") ? l.href : `${person.site}${l.href}`}"`).join("\n")}
              lang="bash"
              wrap
            />
          </div>
        </div>
      }
    />
  );
}
