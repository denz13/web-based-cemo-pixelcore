import type { VisionInterpretation } from "@/src/lib/visionInterpretation";
import {
  OBSERVATION_CATEGORY_OPTIONS,
  type ObservationType,
} from "@/lib/submit-observation";
import type { TaxonResolution } from "@/lib/taxon-resolve";

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read file"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}

export function matchCategory(
  options: readonly string[],
  commonName: string
): string {
  const n = commonName.trim().toLowerCase();
  if (!n) return options[0];
  const exact = options.find((opt) => opt.toLowerCase() === n);
  if (exact) return exact;
  const partial = options.find(
    (opt) => n.includes(opt.toLowerCase()) || opt.toLowerCase().includes(n)
  );
  if (partial) return partial;
  if (/\b(lily|flower|rose|orchid|bloom|blossom|petal)\b/i.test(commonName)) {
    const hit = options.find((o) => /flower/i.test(o));
    if (hit) return hit;
  }
  if (/\b(tree|narra|mahogany|oak|cedar|palm|acacia)\b/i.test(commonName)) {
    const hit = options.find((o) => /tree/i.test(o));
    if (hit) return hit;
  }
  if (/\b(bird|eagle|hawk|duck|chicken|owl|crow)\b/i.test(commonName)) {
    const hit = options.find((o) => /bird/i.test(o));
    if (hit) return hit;
  }
  if (/\b(fish|tilapia|shark)\b/i.test(commonName)) {
    const hit = options.find((o) => /fish/i.test(o));
    if (hit) return hit;
  }
  if (/\b(snake|lizard|turtle|croc)\b/i.test(commonName)) {
    const hit = options.find((o) => /reptile/i.test(o));
    if (hit) return hit;
  }
  return options[0];
}

export function inferObservationType(
  interpretation: VisionInterpretation
): ObservationType | null {
  const { domain, floraSupport, faunaSupport } = interpretation;
  if (domain === "flora") return "Flora";
  if (domain === "fauna") return "Fauna";
  if (domain === "mixed") {
    return floraSupport >= faunaSupport ? "Flora" : "Fauna";
  }
  return null;
}

/** Fill common / scientific / type / category / description from Vision interpretation.
 * Scientific name is set only when the Vision API response includes a resolved `taxon` (server-side lookup).
 */
export function applyInterpretationToObservationFields(
  interpretation: VisionInterpretation,
  callbacks: {
    setCommonName: (v: string) => void;
    setScientificName: (v: string) => void;
    setType: (t: ObservationType) => void;
    setCategory: (c: string) => void;
    setDescription: (updater: (prev: string) => string) => void;
  },
  taxon?: TaxonResolution | null
): void {
  const primary = interpretation.primaryIdentification.trim();
  const normalizedCommonName = taxon?.commonName?.trim() || primary;
  const scientific = taxon?.scientificName?.trim() ?? "";

  callbacks.setCommonName(normalizedCommonName);
  callbacks.setScientificName(scientific);

  const inferred = inferObservationType(interpretation);
  const chosenType: ObservationType =
    inferred ?? (interpretation.faunaSupport >= interpretation.floraSupport ? "Fauna" : "Flora");
  callbacks.setType(chosenType);

  const opts = OBSERVATION_CATEGORY_OPTIONS[chosenType];
  const categoryHints = [
    normalizedCommonName,
    scientific,
    ...interpretation.alternateIdentifications.map((a) => a.name),
    ...interpretation.webEntities.map((w) => w.description),
    ...(chosenType === "Flora" ? interpretation.floraSignals : interpretation.faunaSignals),
  ]
    .map((t) => t.trim())
    .filter(Boolean);

  const matchedCategory =
    categoryHints
      .map((hint) => matchCategory(opts, hint))
      .find((candidate) => candidate !== opts[0]) ?? matchCategory(opts, normalizedCommonName);
  callbacks.setCategory(matchedCategory);
  const alt = interpretation.alternateIdentifications
    .slice(0, 4)
    .map((a) => `${a.name} (${(a.score * 100).toFixed(0)}%)`)
    .join(", ");
  const lookupNote = taxon
    ? ` · Taxon lookup: ${
        taxon.source === "google_kg"
          ? "Google KG"
          : taxon.source === "wikidata"
            ? "Wikidata"
            : taxon.source === "inaturalist"
              ? "iNaturalist"
              : "Wikipedia"
      }`
    : "";
  const aiLine = `[AI] Pangunahing hula: ${normalizedCommonName} (${(interpretation.primaryScore * 100).toFixed(1)}%)${alt ? ` · Iba pa: ${alt}` : ""}${lookupNote}`;
  callbacks.setDescription((prev) => {
    const blocks = prev.split(/\n\n/).filter((b) => !b.trimStart().startsWith("[AI]"));
    const base = blocks.join("\n\n").trim();
    if (!base) return aiLine;
    return `${base}\n\n${aiLine}`;
  });
}
