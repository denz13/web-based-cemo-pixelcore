"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const hiddenRoutes = new Set(["/login", "/register"]);

const quickLinks = [
  { label: "Species Inventory", href: "/inventory" },
  { label: "Biodiversity Map", href: "/map" },
  { label: "Submit Observation", href: "/submit-observation" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Reports", href: "/reports" },
];

const resources = [
  {
    label: "DENR Biodiversity",
    href: "https://bmb.gov.ph/",
    external: true,
  },
  {
    label: "BMB Philippines",
    href: "https://bmb.gov.ph/",
    external: true,
  },
  {
    label: "Data Privacy Policy",
    href: "/privacy-policy",
    external: false,
  },
  {
    label: "Terms of Use",
    href: "/terms-of-use",
    external: false,
  },
];

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M14 5h5v5m0-5-8 8M10 7H8a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-5 w-5 shrink-0">
      <path
        d="M12 21s6-4.9 6-10a6 6 0 1 0-12 0c0 5.1 6 10 6 10Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-5 w-5 shrink-0">
      <path
        d="M5.5 4.5h3l1.2 4-1.9 1.9a14.5 14.5 0 0 0 5.8 5.8l1.9-1.9 4 1.2v3c0 .8-.7 1.5-1.5 1.5C10.6 20 4 13.4 4 6c0-.8.7-1.5 1.5-1.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-5 w-5 shrink-0">
      <path
        d="M4 7.5A1.5 1.5 0 0 1 5.5 6h13A1.5 1.5 0 0 1 20 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 16.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m5 8 7 5 7-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Footer() {
  const pathname = usePathname();

  if (hiddenRoutes.has(pathname)) {
    return null;
  }

  return (
    <footer className="bg-[#216d38] px-4 pb-5 pt-12 text-white sm:px-6 sm:pt-14 md:px-10 lg:px-16">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-12 border-b border-white/12 pb-14 md:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_1.25fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
                <Image
                  src="/biosnap.png"
                  alt="Biosnap logo"
                  width={40}
                  height={40}
                  className="h-9 w-9 object-contain"
                />
              </div>
              <div>
                <Link
                  href="/"
                  className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-none tracking-[-0.03em] sm:text-4xl"
                >
                  Biosnap
                </Link>
                <p className="mt-1 text-base text-white/74 sm:text-lg">CEMO Marikina</p>
              </div>
            </div>
            <p className="mt-6 max-w-md text-base leading-8 text-white/84 sm:mt-8 sm:text-[1.05rem] sm:leading-10">
              An intelligent biodiversity inventory system for monitoring,
              documenting, and protecting the rich ecological heritage of
              Marikina City.
            </p>
          </div>

          <div>
            <h3 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Quick Links
            </h3>
            <ul className="mt-6 space-y-4 text-base text-white/84 sm:mt-8 sm:text-[1.05rem]">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Resources
            </h3>
            <ul className="mt-6 space-y-4 text-base text-white/84 sm:mt-8 sm:text-[1.05rem]">
              {resources.map((resource) => (
                <li key={resource.label}>
                  {resource.external ? (
                    <a
                      href={resource.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 transition-colors hover:text-white"
                    >
                      <span>{resource.label}</span>
                      <ExternalLinkIcon />
                    </a>
                  ) : (
                    <Link
                      href={resource.href}
                      className="transition-colors hover:text-white"
                    >
                      {resource.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Contact Us
            </h3>
            <div className="mt-6 space-y-6 text-base text-white/84 sm:mt-8 sm:space-y-7 sm:text-[1.05rem]">
              <div className="flex items-start gap-4">
                <LocationIcon />
                <div className="space-y-1">
                  <p>City Environmental Management Office</p>
                  <p>Marikina City Hall, Shoe Avenue</p>
                  <p>Marikina City, Metro Manila</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <PhoneIcon />
                <a href="tel:0286462301" className="transition-colors hover:text-white">
                  (02) 8646-2301
                </a>
              </div>

              <div className="flex items-start gap-4">
                <MailIcon />
                <a
                  href="mailto:cemo@marikina.gov.ph"
                  className="transition-colors hover:text-white"
                >
                  cemo@marikina.gov.ph
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-8 text-sm text-[#d9e4b6] sm:pt-11 sm:text-base md:flex-row md:items-center md:justify-between">
          <p>
            © 2026 City Environmental Management Office - Marikina City. All
            rights reserved.
          </p>
          <p>
            In compliance with Republic Act 10173 (Data Privacy Act of 2012)
          </p>
        </div>
      </div>
    </footer>
  );
}
