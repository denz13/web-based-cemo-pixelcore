import { Suspense } from "react";
import { MARIKINA_BARANGAYS } from "@/lib/marikina-barangays";
import ReviewPendingFilters from "./review-pending-filters";

type SearchParams = {
  search?: string | string[];
  status?: string | string[];
  barangay?: string | string[];
};

function firstString(v: string | string[] | undefined): string {
  if (v === undefined) return "";
  return Array.isArray(v) ? (v[0] ?? "") : v;
}

export default async function ReviewPendingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const search = firstString(sp.search);
  const statusRaw = firstString(sp.status);
  const status: "pending" | "verified" | "all" =
    statusRaw === "verified" || statusRaw === "all" ? statusRaw : "pending";
  const barangay = firstString(sp.barangay);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--background)] px-4 py-8 sm:px-6 md:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
          Review pending
        </h1>
        <p className="mt-2 max-w-2xl text-base text-[var(--muted-foreground)]">
          Filter observations by status and barangay. Connect your list/table to the
          review API when ready.
        </p>
        <div className="mt-8">
          <Suspense
            fallback={
              <div className="h-12 w-full animate-pulse rounded-xl bg-muted/60" />
            }
          >
            <ReviewPendingFilters
              search={search}
              status={status}
              barangay={barangay}
              barangays={[...MARIKINA_BARANGAYS]}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
