import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { preload } from "react-dom";

import { CommandPalette } from "@/components/command-palette";
import { Footer } from "@/components/footer";
import { LensRoot } from "@/components/lens";
import { Nav } from "@/components/nav";
import { NavigationFade } from "@/components/navigation-fade";
import { Toaster } from "@/components/toast";
import { about, hero, person, projects } from "@/content/site";

import "./globals.css";

const description = `I build reliable checkout and payment systems for fast-growing fintech teams. ${hero.status}`;

export const metadata: Metadata = {
  metadataBase: new URL(person.site),
  title: {
    default: `${person.name}, ${person.role.toLowerCase()}`,
    template: `%s | ${person.name}`,
  },
  description,
  authors: [{ name: person.name, url: person.site }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: person.name,
    title: `${person.name}, ${person.role.toLowerCase()}`,
    description,
    locale: "en",
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { email: false, telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef1f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1726" },
  ],
  colorScheme: "light dark",
};

/*
 * Runs before first paint: applies a saved theme, honours ?view=source, and
 * marks a first visit to the home page so it paints as source and wipes in.
 */
const HEAD_SCRIPT = `(function(){var d=document.documentElement;try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")d.dataset.theme=t}catch(e){}if(new URLSearchParams(location.search).get("view")==="source"){d.dataset.view="source";return}if(location.pathname!=="/"||matchMedia("(prefers-reduced-motion: reduce)").matches)return;try{if(!localStorage.getItem("intro-seen")){localStorage.setItem("intro-seen","1");d.dataset.intro="pending"}}catch(e){}})();`;

const GUTTER = Array.from({ length: 900 }, (_, i) => i + 1).join("\n");

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: person.name,
  jobTitle: person.role,
  description,
  url: person.site,
  email: `mailto:${person.email}`,
  image: new URL(about.portrait.src.src, person.site).toString(),
  worksFor: { "@type": "Organization", name: person.company },
  address: { "@type": "PostalAddress", addressLocality: person.location },
  knowsLanguage: person.languages,
  knowsAbout: Array.from(new Set(projects.flatMap((p) => p.stack))),
  sameAs: [person.links.github, person.links.linkedin],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  preload("/fonts/mona-sans.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  preload("/fonts/monaspace-neon.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: HEAD_SCRIPT }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Nav />
        {children}
        <Footer />
        <CommandPalette />
        <Toaster />
        <div className="source-gutter" aria-hidden="true">
          <pre>{GUTTER}</pre>
        </div>
        <LensRoot />
        <NavigationFade />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
