"use client";

import dynamic from "next/dynamic";
import type { MapPageData } from "../../lib/map-page";

const BiodiversityMap = dynamic(() => import("./biodiversity-map"), {
  ssr: false,
  loading: () => (
    <section className="px-4 py-10 sm:px-6 md:px-10 lg:px-16">
      <div className="mx-auto max-w-[1640px] rounded-[1.5rem] border border-[var(--border-soft)] bg-white p-8 text-center text-[var(--muted-foreground)] shadow-[0_18px_36px_rgba(20,64,35,0.05)]">
        Loading interactive map...
      </div>
    </section>
  ),
});

export default function BiodiversityMapShell(props: MapPageData) {
  return <BiodiversityMap {...props} />;
}
