import type { MetadataRoute } from "next";

import { person, projects } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: person.site, changeFrequency: "monthly", priority: 1 },
    { url: `${person.site}/resume`, changeFrequency: "monthly", priority: 0.6 },
    ...projects.map((p) => ({
      url: `${person.site}/work/${p.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
