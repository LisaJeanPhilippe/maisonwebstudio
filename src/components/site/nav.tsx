"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Logo } from "@/components/ui/logo";
import { ArrowRight } from "@/components/ui/icons";
import { splitLocale } from "@/i18n/config";
import { LocaleLink, useI18n } from "@/i18n/client";
import { LanguageList, LanguageMenu } from "./language-switcher";

export function Nav() {
  const { m } = useI18n();
  const pathname = usePathname() || "/";
  const { path } = splitLocale(pathname);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  const toggle = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);

  const links = [
    { href: "/work", label: m.nav.work },
    { href: "/services", label: m.nav.services },
    { href: "/pricing", label: m.nav.pricing },
    { href: "/process", label: m.nav.process },
    { href: "/about", label: m.nav.about },
  ];

  // Close the drawer whenever the route changes.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // While the mobile menu is open: lock scrolling, make the page behind it inert,
  // move focus into the menu, and close on Escape (returning focus to the toggle).
  useEffect(() => {
    if (!open) return;
    const outside = [document.getElementById("main"), document.querySelector("body > footer, footer")].filter(
      Boolean,
    ) as HTMLElement[];
    document.documentElement.style.overflow = "hidden";
    outside.forEach((el) => el.setAttribute("inert", ""));
    drawer.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const toggleEl = toggle.current;
    return () => {
      document.documentElement.style.overflow = "";
      outside.forEach((el) => el.removeAttribute("inert"));
      window.removeEventListener("keydown", onKey);
      toggleEl?.focus();
    };
  }, [open]);

  const isActive = (href: string) => path === href || path.startsWith(`${href}/`);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`border-b transition-[background-color,border-color,backdrop-filter] duration-500 ease-out-soft ${
          scrolled || open
            ? "border-line/80 bg-canvas/90 backdrop-blur-xl backdrop-saturate-150"
            : "border-transparent bg-transparent"
        }`}
      >
        <nav className="container-page flex h-[var(--nav-height)] items-center justify-between gap-4" aria-label={m.nav.label}>
          <Logo />

          <ul className="hidden items-center gap-1 lg:flex">
            {links.map((link) => (
              <li key={link.href}>
                <LocaleLink
                  href={link.href}
                  className={`inline-flex min-h-10 items-center rounded-full px-4 text-[14.5px] tracking-[-0.01em] transition-colors duration-300 ${
                    isActive(link.href) ? "text-ink" : "text-muted hover:text-ink"
                  }`}
                  aria-current={isActive(link.href) ? "page" : undefined}
                >
                  {link.label}
                </LocaleLink>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <div className="hidden lg:block">
              <LanguageMenu />
            </div>
            <LocaleLink href="/start" className="btn btn-primary btn-sm group hidden sm:inline-flex">
              {m.common.startYourWebsite}
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
            </LocaleLink>
            <button
              ref={toggle}
              type="button"
              className="relative grid h-11 w-11 place-items-center rounded-full border border-line-strong lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? m.nav.closeMenu : m.nav.openMenu}
            >
              <span
                aria-hidden
                className={`absolute h-px w-4 bg-ink transition-transform duration-300 ${open ? "rotate-45" : "-translate-y-[3px]"}`}
              />
              <span
                aria-hidden
                className={`absolute h-px w-4 bg-ink transition-transform duration-300 ${open ? "-rotate-45" : "translate-y-[3px]"}`}
              />
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={drawer}
            id="mobile-menu"
            className="fixed inset-x-0 bottom-0 top-[var(--nav-height)] overflow-y-auto bg-canvas lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="container-page flex min-h-full flex-col justify-between gap-10 pb-10 pt-6">
              <ul className="flex flex-col">
                {links.map((link, i) => (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="border-b border-line"
                  >
                    <LocaleLink
                      href={link.href}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      className="flex items-center justify-between py-4 text-[1.75rem] font-medium tracking-[-0.035em]"
                    >
                      {link.label}
                      <ArrowRight size={20} className="text-subtle" />
                    </LocaleLink>
                  </motion.li>
                ))}
              </ul>
              <div className="flex flex-col gap-6">
                <div>
                  <p className="eyebrow mb-3">{m.language.label}</p>
                  <LanguageList className="flex flex-wrap gap-1" />
                </div>
                <LocaleLink href="/start" className="btn btn-primary h-14 w-full text-base">
                  {m.common.startYourWebsite}
                </LocaleLink>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
