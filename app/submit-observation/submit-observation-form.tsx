"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import type { VisionInterpretation } from "@/src/lib/visionInterpretation";
import type { TaxonResolution } from "@/lib/taxon-resolve";
import { ObservationDetailsSection } from "@/components/observation/ObservationDetailsSection";
import { fileToDataUrl } from "@/lib/observation-form-helpers";
import { MAX_OBSERVATION_FILES } from "@/lib/submit-observation";

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10">
      <path
        d="M12 16V5m0 0-4 4m4-4 4 4M5 18.5v.5A2 2 0 0 0 7 21h10a2 2 0 0 0 2-2v-.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path
        d="M5 8.5h2.1l1.2-1.8h7.4l1.2 1.8H19c1.1 0 2 .9 2 2V17c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-6.5c0-1.1.9-2 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="13"
        r="3.25"
        stroke="currentColor"
        strokeWidth="1.8"
      />
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

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="m12 4 1.6 3.8L17.4 9.4l-3.8 1.6L12 14.8l-1.6-3.8L6.6 9.4l3.8-1.6L12 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-5 w-5 shrink-0">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
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

const photoTips = [
  "Take clear, well-lit photos",
  "Include multiple angles if possible",
  "Show identifying features (leaves, flowers, markings)",
  "Include scale reference when possible",
];

export default function SubmitObservationForm() {
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [visionInterpretation, setVisionInterpretation] =
    useState<VisionInterpretation | null>(null);
  const [resolvedTaxon, setResolvedTaxon] = useState<TaxonResolution | null>(null);

  function updateFiles(nextFiles: File[]) {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));

    setFiles(nextFiles);
    setPreviewUrls(nextFiles.map((file) => URL.createObjectURL(file)));
    setAiNotice(null);
    if (nextFiles.length === 0) {
      setVisionInterpretation(null);
      setResolvedTaxon(null);
    }
  }

  const runAiIdentify = useCallback(async () => {
    if (files.length === 0) {
      setAiNotice("Mag-upload muna ng larawan bago mag-Identify with AI.");
      return;
    }
    setAiBusy(true);
    setAiNotice(null);
    try {
      const dataUrl = await fileToDataUrl(files[0]);
      const res = await fetch("/api/vision/annotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: dataUrl }),
      });
      const payload = (await res.json()) as {
        interpretation?: VisionInterpretation;
        taxon?: TaxonResolution | null;
        error?: string;
      };
      if (!res.ok) {
        setVisionInterpretation(null);
        setResolvedTaxon(null);
        setAiNotice(payload.error ?? `Vision API error (${res.status}).`);
        return;
      }
      const interpretation = payload.interpretation;
      if (!interpretation) {
        setVisionInterpretation(null);
        setResolvedTaxon(null);
        setAiNotice("Walang interpretation mula sa server.");
        return;
      }

      setVisionInterpretation(interpretation);
      setResolvedTaxon(payload.taxon ?? null);
      setAiNotice(
        "Na-fill ang Observation Details mula sa Cloud Vision — unang larawan lang ang ginamit. I-verify pa rin bago mag-submit."
      );
    } catch {
      setVisionInterpretation(null);
      setResolvedTaxon(null);
      setAiNotice("Hindi makakonekta sa Vision API.");
    } finally {
      setAiBusy(false);
    }
  }, [files]);

  return (
    <section className="px-4 py-10 sm:px-6 md:px-10 lg:px-16">
      <div className="mx-auto grid max-w-6xl gap-8 xl:grid-cols-[370px_minmax(0,1fr)]">
        <div className="space-y-7">
          <article className="rounded-[1.6rem] border border-[var(--border-soft)] bg-white p-6 shadow-[0_18px_38px_rgba(20,64,35,0.06)] sm:p-7">
            <div className="flex items-center gap-3 text-[var(--foreground)]">
              <CameraIcon />
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.03em]">
                Upload Photos
              </h2>
            </div>
            <p className="mt-2 text-base text-[var(--muted-foreground)]">
              Upload up to {MAX_OBSERVATION_FILES} clear photos of the species
            </p>

            <label
              htmlFor="photo-upload"
              className="mt-7 flex cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[#d5dfd4] px-6 py-10 text-center text-[var(--muted-foreground)] transition-colors hover:border-[var(--brand-600)] hover:bg-[var(--brand-50)]/35"
            >
              <UploadIcon />
              <p className="mt-5 text-2xl font-medium text-[var(--foreground)]">
                Click to upload
              </p>
              <p className="mt-2 text-sm">
                JPG, PNG or WEBP (max 10MB each)
              </p>
              <input
                id="photo-upload"
                name="photos"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(event) => {
                  const nextFiles = Array.from(event.target.files ?? []).slice(
                    0,
                    MAX_OBSERVATION_FILES,
                  );
                  updateFiles(nextFiles);
                }}
              />
            </label>

            {previewUrls.length > 0 ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {previewUrls.map((url, index) => (
                  <div
                    key={url}
                    className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--border-soft)] bg-[#edf1ea]"
                  >
                    <Image
                      src={url}
                      alt={`Observation preview ${index + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void runAiIdentify()}
              disabled={files.length === 0 || aiBusy}
              className={`mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border px-4 text-base font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                files.length > 0
                  ? "border-[var(--brand-600)] bg-[var(--brand-50)] text-[var(--brand-800)] hover:bg-[var(--brand-100)]"
                  : "border-[var(--border-soft)] bg-[#f6f8f4] text-[var(--muted-foreground)]"
              }`}
            >
              {aiBusy ? (
                <span className="text-sm">Kinukuha ang AI…</span>
              ) : (
                <>
                  <SparkIcon />
                  Identify with AI
                </>
              )}
            </button>
            {aiNotice ? (
              <p className="mt-3 rounded-lg border border-[#d5dfd4] bg-[#f6faf5] px-3 py-2 text-sm text-[var(--foreground)]">
                {aiNotice}
              </p>
            ) : null}
          </article>

          <article className="rounded-[1.6rem] border border-[var(--border-soft)] bg-white p-6 shadow-[0_18px_38px_rgba(20,64,35,0.06)] sm:p-7">
            <div className="flex items-center gap-3 text-[var(--foreground)]">
              <InfoIcon />
              <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-[-0.03em]">
                Photo Tips
              </h2>
            </div>
            <ul className="mt-6 space-y-4 text-base leading-7 text-[var(--muted-foreground)]">
              {photoTips.map((tip) => (
                <li key={tip} className="flex gap-3">
                  <span className="text-[#2fa859]">
                    <CheckIcon />
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <ObservationDetailsSection
          formId="submit-observation-form"
          photoFiles={files}
          interpretation={visionInterpretation}
          taxon={resolvedTaxon}
          onSubmitSuccess={() => {
            updateFiles([]);
            setVisionInterpretation(null);
            setResolvedTaxon(null);
          }}
        />
      </div>
    </section>
  );
}
