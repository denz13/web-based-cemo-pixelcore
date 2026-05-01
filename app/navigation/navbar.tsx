"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Inventory", href: "/inventory" },
  { label: "Map", href: "/map" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Submit Observation", href: "/submit-observation" },
  { label: "Reports", href: "/reports" },
];

const hiddenRoutes = new Set(["/login", "/register"]);

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M12 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Zm-6 7.5c.7-3 3.15-4.5 6-4.5s5.3 1.5 6 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isHomePage = pathname === "/";

  if (hiddenRoutes.has(pathname)) {
    return null;
  }

  return (
    <header
      className={`inset-x-0 top-0 z-30 ${
        isHomePage
          ? "absolute"
          : "sticky border-b border-white/8 bg-[linear-gradient(180deg,rgba(25,70,74,0.96),rgba(24,64,86,0.96))] shadow-[0_12px_30px_rgba(7,24,20,0.16)]"
      }`}
    >
      <div
        className={`mx-auto max-w-[1280px] px-5 md:px-8 lg:px-12 ${
          isHomePage ? "pt-3" : ""
        }`}
      >
        <div
          className={`px-5 py-4 text-white backdrop-blur md:px-8 ${
            isHomePage
              ? "rounded-b-[1.75rem] border-x border-b border-white/10 bg-[linear-gradient(180deg,rgba(25,70,74,0.9),rgba(24,64,86,0.92))] shadow-[0_18px_36px_rgba(7,24,20,0.18)]"
              : ""
          }`}
        >
          <div className="flex items-center justify-between gap-4 xl:hidden">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/18 bg-white shadow-[0_8px_18px_rgba(7,24,20,0.18)]"
                aria-label="Go to Biosnap home"
              >
                <Image
                  src="/biosnap.png"
                  alt="Biosnap logo"
                  width={44}
                  height={44}
                  className="h-9 w-9 object-contain"
                />
              </Link>
              <div className="min-w-0">
                <Link
                  href="/"
                  className="block truncate font-[family-name:var(--font-display)] text-3xl font-semibold leading-none tracking-[-0.03em]"
                >
                  Biosnap
                </Link>
                <p className="truncate text-xs text-white/72 sm:text-sm">
                  Marikina Biodiversity Inventory
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/5 transition-colors hover:bg-white/10"
                aria-label="Go to profile"
              >
                <AccountIcon />
              </Link>
              <button
                type="button"
                onClick={() => setIsMenuOpen((open) => !open)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/14 bg-white/5 transition-colors hover:bg-white/10"
                aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>

          {isMenuOpen ? (
            <div className="mt-4 border-t border-white/10 pt-4 xl:hidden">
              <nav className="flex flex-col gap-2 text-sm font-semibold text-white/88">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`rounded-2xl px-4 py-3 transition-colors ${
                        isActive
                          ? "bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                          : "hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ) : null}

          <div className="hidden xl:flex xl:flex-row xl:items-center xl:justify-between xl:gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/18 bg-white shadow-[0_8px_18px_rgba(7,24,20,0.18)]"
                aria-label="Go to Biosnap home"
              >
                <Image
                  src="/biosnap.png"
                  alt="Biosnap logo"
                  width={48}
                  height={48}
                  className="h-10 w-10 object-contain"
                />
              </Link>
              <div>
                <Link
                  href="/"
                  className="font-[family-name:var(--font-display)] text-[2rem] font-semibold leading-none tracking-[-0.03em]"
                >
                  Biosnap
                </Link>
                <p className="mt-1 text-sm text-white/72">
                  Marikina Biodiversity Inventory
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-white/88">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`rounded-2xl px-5 py-3 transition-colors ${
                        isActive
                          ? "bg-white/16 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                          : "hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="flex items-center gap-3 text-white/92">
                <Link
                  href="/profile"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/14 bg-white/5 transition-colors hover:bg-white/10"
                  aria-label="Go to profile"
                >
                  <AccountIcon />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
