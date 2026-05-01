"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Props = {
  search: string;
  status: "pending" | "verified" | "all";
  barangay: string;
  barangays: string[];
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ReviewPendingFilters({
  search,
  status,
  barangay,
  barangays,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(search);

  function pushParams(nextSearch: string, nextStatus: string, nextBarangay: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextSearch) {
      params.set("search", nextSearch);
    } else {
      params.delete("search");
    }

    if (nextStatus && nextStatus !== "pending") {
      params.set("status", nextStatus);
    } else {
      params.delete("status");
    }

    if (nextBarangay) {
      params.set("barangay", nextBarangay);
    } else {
      params.delete("barangay");
    }

    router.push(`/review-pending${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_210px_250px]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          pushParams(searchValue.trim(), status, barangay);
        }}
        className="relative"
      >
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
          <SearchIcon />
        </span>
        <input
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Search species, barangay, or notes..."
          className="h-12 w-full rounded-xl border border-[var(--border-soft)] bg-white pl-12 pr-4 text-base text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand-700)]"
        />
      </form>

      <select
        value={status}
        onChange={(event) => pushParams(searchValue.trim(), event.target.value, barangay)}
        className="h-12 rounded-xl border border-[var(--border-soft)] bg-white px-4 text-base text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand-700)]"
      >
        <option value="pending">Pending</option>
        <option value="verified">Verified</option>
        <option value="all">All Statuses</option>
      </select>

      <select
        value={barangay}
        onChange={(event) => pushParams(searchValue.trim(), status, event.target.value)}
        className="h-12 rounded-xl border border-[var(--border-soft)] bg-white px-4 text-base text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand-700)]"
      >
        <option value="">All Barangays</option>
        {barangays.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}
