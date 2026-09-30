"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { person } from "@/content/site";
import { copyEmail, currentTheme, downloadResume, toggleTheme } from "@/lib/actions";

import { GlassSpec } from "./glass";
import { toggleView, useView } from "./lens";

let isOpen = false;
const listeners = new Set<() => void>();
function setOpen(next: boolean) {
  isOpen = next;
  listeners.forEach((fn) => fn());
}
export function openPalette() {
  setOpen(true);
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

type Action = { id: string; label: string; keywords?: string; hint?: string; run: () => void };

export function CommandPalette() {
  const open = useSyncExternalStore(subscribe, () => isOpen, () => false);
  const view = useView();
  const router = useRouter();
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const listId = useId();

  // ⌘K on macOS, Ctrl+K elsewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!isOpen);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      setQuery("");
      setActive(0);
      setTheme(currentTheme());
      d.showModal();
      input.current?.focus();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  const goTo = useCallback(
    (id: string) => {
      if (pathname !== "/") {
        router.push(`/#${id}`);
        return;
      }
      const el = document.getElementById(id);
      if (!el) return;
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      history.replaceState(history.state, "", `#${id}`);
      el.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
    },
    [pathname, router],
  );

  const actions = useMemo<Action[]>(
    () => [
      { id: "work", label: "Go to Work", keywords: "projects case studies", run: () => goTo("work") },
      { id: "experience", label: "Go to Experience", keywords: "jobs roles history", run: () => goTo("experience") },
      { id: "about", label: "Go to About", keywords: "bio principles", run: () => goTo("about") },
      { id: "contact", label: "Go to Contact", keywords: "hire email", run: () => goTo("contact") },
      { id: "email", label: "Copy email address", keywords: person.email, run: copyEmail },
      { id: "resume", label: "Download résumé", keywords: "resume cv pdf", run: downloadResume },
      {
        id: "view",
        label: view === "source" ? "View page" : "View source",
        keywords: "code inspect lens",
        hint: "V",
        run: () => toggleView("switch"),
      },
      {
        id: "theme",
        label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
        keywords: "theme appearance mode",
        run: toggleTheme,
      },
      {
        id: "github",
        label: "Open GitHub profile",
        keywords: "code repositories",
        run: () => window.open(person.links.github, "_blank", "noopener"),
      },
      {
        id: "linkedin",
        label: "Open LinkedIn profile",
        run: () => window.open(person.links.linkedin, "_blank", "noopener"),
      },
    ],
    [goTo, theme, view],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) => `${a.label} ${a.keywords ?? ""}`.toLowerCase().includes(q));
  }, [actions, query]);

  const run = (a: Action | undefined) => {
    if (!a) return;
    setOpen(false);
    // Let the dialog close and focus return before the action moves anything.
    requestAnimationFrame(() => a.run());
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const n = results.length;
    if (e.key === "ArrowDown") setActive((i) => (n ? (i + 1) % n : 0));
    else if (e.key === "ArrowUp") setActive((i) => (n ? (i - 1 + n) % n : 0));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(Math.max(0, n - 1));
    else if (e.key === "Enter") run(results[active]);
    else return;
    e.preventDefault();
  };

  const optionId = (a: Action) => `${listId}-${a.id}`;

  return (
    <dialog
      ref={dialog}
      className="palette glass"
      data-glass
      aria-label="Command palette"
      onClose={() => setOpen(false)}
      onClick={(e) => {
        if (e.target === dialog.current) setOpen(false);
      }}
    >
      <GlassSpec />
      <div className="relative">
        <input
          ref={input}
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={results[active] ? optionId(results[active]) : undefined}
          aria-label="Search actions"
          placeholder="Type a command or search"
          autoComplete="off"
          spellCheck={false}
          className="palette-input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
        <ul id={listId} role="listbox" aria-label="Actions" className="palette-list">
          {results.map((a, i) => (
            <li
              key={a.id}
              id={optionId(a)}
              role="option"
              aria-selected={i === active}
              className="palette-option"
              onMouseMove={() => setActive(i)}
              onClick={() => run(a)}
            >
              <span>{a.label}</span>
              {a.hint ? <kbd className="keycap">{a.hint}</kbd> : null}
            </li>
          ))}
        </ul>
        {results.length === 0 ? <p className="palette-empty">No actions match “{query}”.</p> : null}
      </div>
    </dialog>
  );
}
