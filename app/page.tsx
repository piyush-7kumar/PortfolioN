import { About } from "@/components/about";
import { Contact } from "@/components/contact";
import { Experience } from "@/components/experience";
import { Hero } from "@/components/hero";
import { Work } from "@/components/work";

export default function Home() {
  return (
    <main id="main" tabIndex={-1}>
      <Hero />
      <Work />
      <Experience />
      <About />
      <Contact />
    </main>
  );
}
