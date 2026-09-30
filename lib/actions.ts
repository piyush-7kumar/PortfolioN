import { person } from "@/content/site";
import { toast } from "@/components/toast";

/** Copy the email address and confirm it with a toast. */
export async function copyEmail() {
  try {
    await navigator.clipboard.writeText(person.email);
    toast("Email address copied");
  } catch {
    toast(`Couldn't copy. The address is ${person.email}`);
  }
}

export function downloadResume() {
  const a = document.createElement("a");
  a.href = person.links.resume;
  a.download = `${person.slug}-resume.pdf`;
  document.body.append(a);
  a.click();
  a.remove();
}

type Theme = "light" | "dark";

export function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Switch theme. Choosing the system's own theme goes back to following it. */
export function toggleTheme() {
  const next: Theme = currentTheme() === "dark" ? "light" : "dark";
  const system: Theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const root = document.documentElement;
  try {
    if (next === system) localStorage.removeItem("theme");
    else localStorage.setItem("theme", next);
  } catch {}
  if (next === system) delete root.dataset.theme;
  else root.dataset.theme = next;
}
