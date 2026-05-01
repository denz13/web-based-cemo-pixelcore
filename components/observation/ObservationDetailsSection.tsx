"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { VisionInterpretation } from "@/src/lib/visionInterpretation";
import { MARIKINA_BARANGAYS } from "@/lib/marikina-barangays";
import {
  OBSERVATION_CATEGORY_OPTIONS,
  type ObservationType,
} from "@/lib/submit-observation";
import type { TaxonResolution } from "@/lib/taxon-resolve";
import { applyInterpretationToObservationFields } from "@/lib/observation-form-helpers";

type SubmissionState =
  | { status: "idle"; message: "" }
  | { status: "success" | "error"; message: string };

const typeOptions = ["Flora", "Fauna"] as const satisfies readonly ObservationType[];

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M12 21s6-5.7 6-11a6 6 0 1 0-12 0c0 5.3 6 11 6 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 10.2v5.2m0-8.1h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export type ObservationDetailsSectionProps = {
  /** Photos appended to the observation POST as `photos` */
  photoFiles: File[];
  /** When set (e.g. after Cloud Vision), fields auto-fill */
  interpretation?: VisionInterpretation | null;
  /** External taxon resolution (Wikidata / iNaturalist; optional Google KG) — overrides common + scientific when present */
  taxon?: TaxonResolution | null;
  formId?: string;
  /** Optional wrapper classes (e.g. species page embed) */
  className?: string;
  /** Called after a successful POST so parent can clear uploads / vision state */
  onSubmitSuccess?: () => void;
};

export function ObservationDetailsSection({
  photoFiles,
  interpretation = null,
  taxon = null,
  formId = "observation-details-form",
  className = "",
  onSubmitSuccess,
}: ObservationDetailsSectionProps) {
  const [type, setType] = useState<ObservationType>("Fauna");
  const [category, setCategory] = useState(
    () => OBSERVATION_CATEGORY_OPTIONS.Fauna[0]
  );
  const [commonName, setCommonName] = useState("");
  const [scientificName, setScientificName] = useState("");
  const [description, setDescription] = useState("");
  const [barangay, setBarangay] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    status: "idle",
    message: "",
  });

  const categoryOptions = useMemo((): readonly string[] => {
    return OBSERVATION_CATEGORY_OPTIONS[type];
  }, [type]);

  const resetCategory = useCallback((nextType: ObservationType) => {
    setType(nextType);
    setCategory(OBSERVATION_CATEGORY_OPTIONS[nextType][0]);
  }, []);

  useEffect(() => {
    if (!interpretation) return;
    applyInterpretationToObservationFields(
      interpretation,
      {
        setCommonName,
        setScientificName,
        setType,
        setCategory,
        setDescription,
      },
      taxon
    );
  }, [interpretation, taxon]);

  useEffect(() => {
    if (photoFiles.length === 0) {
      setCommonName("");
      setScientificName("");
      setDescription("");
      setBarangay("");
      setSubmissionState({ status: "idle", message: "" });
      resetCategory("Fauna");
    }
  }, [photoFiles.length, resetCategory]);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setSubmissionState({ status: "idle", message: "" });

    photoFiles.forEach((file) => {
      formData.append("photos", file);
    });

    try {
      const response = await fetch("/api/observations", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message ?? "Unable to submit observation.");
      }

      setSubmissionState({
        status: "success",
        message:
          result.message ??
          "Observation submitted successfully and saved for review.",
      });
      setCommonName("");
      setScientificName("");
      setDescription("");
      setBarangay("");
      resetCategory("Fauna");

      const form = document.getElementById(formId) as HTMLFormElement | null;
      form?.reset();
      onSubmitSuccess?.();
    } catch (error) {
      setSubmissionState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to submit observation.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article
      className={`rounded-[1.6rem] border border-[var(--border-soft)] bg-white p-6 shadow-[0_18px_38px_rgba(20,64,35,0.06)] sm:p-7 ${className}`}
    >
      <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.03em] text-[var(--foreground)] sm:text-4xl">
        Observation Details
      </h2>
      <p className="mt-2 text-base text-[var(--muted-foreground)]">
        Provide information about your species sighting
        {photoFiles.length === 0 ? (
          <span className="mt-1 block text-amber-800">
            Mag-upload muna ng larawan sa itaas para maisama sa submission.
          </span>
        ) : null}
      </p>

      <form id={formId} action={handleSubmit} className="mt-8 space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-base font-semibold text-[var(--foreground)]">
              Common Name *
            </span>
            <input
              name="commonName"
              required
              value={commonName}
              onChange={(e) => setCommonName(e.target.value)}
              className="h-12 w-full rounded-xl border border-[var(--border-soft)] bg-white px-4 text-base text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand-700)]"
              placeholder="Philippine Long-tailed Macaque"
            />
          </label>

          <label className="space-y-2">
            <span className="text-base font-semibold text-[var(--foreground)]">
              Scientific Name
            </span>
            <input
              name="scientificName"
              value={scientificName}
              onChange={(e) => setScientificName(e.target.value)}
              className="h-12 w-full rounded-xl border border-[var(--border-soft)] bg-white px-4 text-base text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand-700)]"
              placeholder="Macaca fascicularis philippensis"
            />
            <span className="block text-sm text-[var(--muted-foreground)]">
              Optional
            </span>
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-base font-semibold text-[var(--foreground)]">
              Category *
            </span>
            <select
              name="type"
              value={type}
              onChange={(event) =>
                resetCategory(event.target.value as ObservationType)
              }
              className="h-12 w-full rounded-xl border border-[var(--border-soft)] bg-white px-4 text-base text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand-700)]"
            >
              {typeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-base font-semibold text-[var(--foreground)]">
              Sub-category *
            </span>
            <select
              name="category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-12 w-full rounded-xl border border-[var(--border-soft)] bg-white px-4 text-base text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand-700)]"
            >
              {categoryOptions.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="space-y-2">
          <span className="inline-flex items-center gap-2 text-base font-semibold text-[var(--foreground)]">
            <PinIcon />
            <span>Location (Barangay) *</span>
          </span>
          <select
            name="barangay"
            required
            value={barangay}
            onChange={(e) => setBarangay(e.target.value)}
            className="h-12 w-full rounded-xl border border-[var(--border-soft)] bg-white px-4 text-base text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand-700)]"
          >
            <option value="" disabled>
              Select barangay
            </option>
            {MARIKINA_BARANGAYS.map((b: string) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <span className="block text-sm text-[var(--muted-foreground)]">
            Select the barangay where you spotted the species
          </span>
        </label>

        <label className="space-y-2">
          <span className="text-base font-semibold text-[var(--foreground)]">
            Description *
          </span>
          <textarea
            name="description"
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-soft)] bg-white px-4 py-3 text-base text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand-700)]"
            placeholder="Describe the species, its behavior, habitat, and any distinguishing features..."
          />
        </label>

        <label className="space-y-2">
          <span className="text-base font-semibold text-[var(--foreground)]">
            Additional Notes
          </span>
          <textarea
            name="additionalNotes"
            rows={4}
            className="w-full rounded-xl border border-[var(--border-soft)] bg-white px-4 py-3 text-base text-[var(--foreground)] outline-none transition-colors focus:border-[var(--brand-700)]"
            placeholder="Any additional observations, time of day, weather conditions, etc."
          />
          <span className="block text-sm text-[var(--muted-foreground)]">
            Optional
          </span>
        </label>

        <div className="rounded-[1.3rem] border border-[#d7e2d8] bg-[#f5faf4] p-5">
          <div className="flex gap-3">
            <span className="pt-0.5 text-[var(--brand-700)]">
              <InfoIcon />
            </span>
            <div>
              <p className="text-base font-semibold text-[var(--foreground)]">
                Data Privacy Notice
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)]">
                Your submission will be reviewed by CEMO staff before publication.
                Precise GPS coordinates are protected and only generalized location
                data (barangay level) will be shown publicly, in compliance with RA
                10173.
              </p>
            </div>
          </div>
        </div>

        {submissionState.status !== "idle" ? (
          <div
            className={`rounded-xl px-4 py-3 text-sm ${
              submissionState.status === "success"
                ? "bg-[#eef8ef] text-[#1d6f39]"
                : "bg-[#fceeee] text-[#b83d3d]"
            }`}
          >
            {submissionState.message}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <button
            type="submit"
            disabled={isSubmitting || photoFiles.length === 0}
            className="inline-flex h-13 flex-1 items-center justify-center rounded-xl bg-[var(--brand-700)] px-6 text-base font-semibold text-white transition-colors hover:bg-[var(--brand-800)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Submitting..." : "Submit Observation"}
          </button>
          <button
            type="button"
            disabled
            className="inline-flex h-13 items-center justify-center rounded-xl border border-[var(--border-soft)] bg-white px-6 text-base font-semibold text-[var(--muted-foreground)] disabled:cursor-not-allowed"
          >
            Save as Draft
          </button>
        </div>
      </form>
    </article>
  );
}
