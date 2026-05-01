"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  observationId: number;
  imageUrl: string | null;
  provider: "mysql" | "firebase";
  firebaseReady: boolean;
};

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M2.5 12s3.4-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.4 5.5-9.5 5.5S2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m8.5 12.4 2.1 2.1 4.9-5.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m9 9 6 6m0-6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ReviewPendingActions({
  observationId,
  imageUrl,
  provider,
  firebaseReady,
}: Props) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);

  async function approveObservation() {
    if (provider !== "mysql") {
      return;
    }

    setIsApproving(true);

    try {
      const response = await fetch(`/api/review-pending/${observationId}/approve`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Unable to approve observation.");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsApproving(false);
    }
  }

  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <a
        href={imageUrl ?? "#"}
        target={imageUrl ? "_blank" : undefined}
        rel={imageUrl ? "noreferrer" : undefined}
        className={`inline-flex items-center gap-2 rounded-xl border border-[var(--border-soft)] px-4 py-2.5 text-sm font-semibold ${
          imageUrl
            ? "bg-white text-[var(--foreground)] transition-colors hover:border-[var(--brand-700)] hover:text-[var(--brand-700)]"
            : "cursor-not-allowed bg-[#f5f6f2] text-[var(--muted-foreground)]"
        }`}
      >
        <EyeIcon />
        <span>Review</span>
      </a>

      <button
        type="button"
        onClick={approveObservation}
        disabled={provider !== "mysql" || isApproving}
        className="inline-flex items-center gap-2 rounded-xl bg-[#1eaf4b] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#189140] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <CheckIcon />
        <span>{isApproving ? "Approving..." : "Approve"}</span>
      </button>

      <button
        type="button"
        disabled
        title={
          firebaseReady
            ? "Reject flow will be added when moderation records are fully supported."
            : "Reject flow is reserved for the future Firebase moderation backend."
        }
        className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-[#e13028] px-4 py-2.5 text-sm font-semibold text-white opacity-85"
      >
        <XIcon />
        <span>Reject</span>
      </button>
    </div>
  );
}
