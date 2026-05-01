"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { InventoryFilters } from "../../lib/inventory-page";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M18 5c-8 .5-12 5-12 11 0 .7 0 1.4.2 2 1-1.4 2.1-2.6 3.5-3.6C13.1 12 16 11.4 18 5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 18c2-2.9 4.3-4.9 7.5-6.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PawIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M7 10c-1.4 0-2.5-1.4-2.5-3.1S5.6 4 7 4s2.5 1.3 2.5 2.9S8.4 10 7 10Zm10 0c-1.4 0-2.5-1.4-2.5-3.1S15.6 4 17 4s2.5 1.3 2.5 2.9S18.4 10 17 10ZM12 8.5c-1.5 0-2.7-1.6-2.7-3.5S10.5 1.5 12 1.5 14.7 3 14.7 5 13.5 8.5 12 8.5Zm0 13c-3.7 0-6.2-2.1-6.2-4.6 0-2 1.6-3.2 3.2-3.2 1.1 0 2 .5 3 1.4 1-1 1.9-1.4 3-1.4 1.6 0 3.2 1.2 3.2 3.2 0 2.5-2.5 4.6-6.2 4.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M4.5 4.5h6v6h-6Zm9 0h6v6h-6Zm-9 9h6v6h-6Zm9 0h6v6h-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M8 6h12M8 12h12M8 18h12M4.5 6h.01M4.5 12h.01M4.5 18h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function buildQueryString(filters: InventoryFilters) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.set("search", filters.search);
  }

  if (filters.category !== "all") {
    params.set("category", filters.category);
  }

  if (filters.barangay) {
    params.set("barangay", filters.barangay);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.view !== "grid") {
    params.set("view", filters.view);
  }

  const query = params.toString();
  return query ? `/inventory?${query}` : "/inventory";
}

function CategoryButton({
  label,
  kind,
  active,
  onClick,
}: {
  label: string;
  kind: "all" | "flora" | "fauna";
  active: boolean;
  onClick: () => void;
}) {
  const icon =
    kind === "flora" ? <LeafIcon /> : kind === "fauna" ? <PawIcon /> : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
        active
          ? "border-[var(--brand-700)] bg-[var(--brand-700)] text-white"
          : "border-[var(--border-soft)] bg-white text-[var(--muted-foreground)] hover:border-[var(--brand-700)]/30 hover:text-[var(--brand-700)]"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default function InventoryFilters({
  filters,
  barangays,
  statuses,
}: {
  filters: InventoryFilters;
  barangays: string[];
  statuses: string[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState(filters.search);

  function pushFilters(nextFilters: InventoryFilters) {
    router.push(buildQueryString(nextFilters));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    pushFilters({
      ...filters,
      search: search.trim(),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 xl:flex-row xl:items-center"
    >
      <div className="relative min-w-0 flex-1">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, scientific name, or description..."
          className="h-12 w-full rounded-xl border border-[var(--border-soft)] bg-[#f8faf5] pl-12 pr-4 text-sm text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)] focus:border-[var(--brand-700)]"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <CategoryButton
          label="All"
          kind="all"
          active={filters.category === "all"}
          onClick={() => {
            setSearch("");
            pushFilters({
              ...filters,
              search: "",
              category: "all",
              barangay: "",
              status: "",
            });
          }}
        />
        <CategoryButton
          label="Flora"
          kind="flora"
          active={filters.category === "flora"}
          onClick={() =>
            pushFilters({
              ...filters,
              search: search.trim(),
              category: "flora",
            })
          }
        />
        <CategoryButton
          label="Fauna"
          kind="fauna"
          active={filters.category === "fauna"}
          onClick={() =>
            pushFilters({
              ...filters,
              search: search.trim(),
              category: "fauna",
            })
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:items-center">
        <select
          value={filters.barangay}
          onChange={(event) =>
            pushFilters({
              ...filters,
              search: search.trim(),
              barangay: event.target.value,
            })
          }
          className="h-12 min-w-[180px] rounded-xl border border-[var(--border-soft)] bg-white px-4 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand-700)]"
        >
          <option value="">All Barangays</option>
          {barangays.map((barangay) => (
            <option key={barangay} value={barangay}>
              {barangay}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(event) =>
            pushFilters({
              ...filters,
              search: search.trim(),
              status: event.target.value,
            })
          }
          className="h-12 min-w-[180px] rounded-xl border border-[var(--border-soft)] bg-white px-4 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand-700)]"
        >
          <option value="">All Statuses</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 xl:ml-auto">
        <button
          type="button"
          onClick={() =>
            pushFilters({
              ...filters,
              search: search.trim(),
              view: "grid",
            })
          }
          className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
            filters.view === "grid"
              ? "border-[var(--brand-700)] bg-[var(--brand-700)] text-white"
              : "border-[var(--border-soft)] bg-white text-[var(--muted-foreground)] hover:text-[var(--brand-700)]"
          }`}
          aria-label="Grid view"
        >
          <GridIcon />
        </button>
        <button
          type="button"
          onClick={() =>
            pushFilters({
              ...filters,
              search: search.trim(),
              view: "list",
            })
          }
          className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
            filters.view === "list"
              ? "border-[var(--brand-700)] bg-[var(--brand-700)] text-white"
              : "border-[var(--border-soft)] bg-white text-[var(--muted-foreground)] hover:text-[var(--brand-700)]"
          }`}
          aria-label="List view"
        >
          <ListIcon />
        </button>
      </div>
    </form>
  );
}
