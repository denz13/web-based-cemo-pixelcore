"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  years: string[];
  selectedYear: string;
  selectedQuarter: string;
};

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M4 5h16l-6.5 7.6V19l-3-1.8v-4.6L4 5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ReportFilters({
  years,
  selectedYear,
  selectedQuarter,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(name: "year" | "quarter", value: string) {
    const nextParams = new URLSearchParams(searchParams.toString());

    if (value === "all") {
      nextParams.delete(name);
    } else {
      nextParams.set(name, value);
    }

    router.push(`/reports${nextParams.toString() ? `?${nextParams.toString()}` : ""}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
        <FilterIcon />
        <span>Filter by:</span>
      </div>

      <label className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
          <CalendarIcon />
        </span>
        <select
          value={selectedYear}
          onChange={(event) => updateParam("year", event.target.value)}
          className="h-11 min-w-[112px] rounded-xl border border-[var(--border-soft)] bg-white pl-11 pr-10 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand-700)]"
        >
          <option value="all">All Years</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>

      <select
        value={selectedQuarter}
        onChange={(event) => updateParam("quarter", event.target.value)}
        className="h-11 min-w-[138px] rounded-xl border border-[var(--border-soft)] bg-white px-4 pr-10 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand-700)]"
      >
        <option value="all">All Quarters</option>
        <option value="q1">Q1</option>
        <option value="q2">Q2</option>
        <option value="q3">Q3</option>
        <option value="q4">Q4</option>
      </select>
    </div>
  );
}
