import type { VisionInterpretation } from "@/src/lib/visionInterpretation";

export type TaxonResolutionSource =
  | "gbif"
  | "inaturalist"
  | "google_kg"
  | "wikidata"
  | "wikipedia"
  | "manual";

export type TaxonResolution = {
  commonName: string;
  scientificName: string;
  source: TaxonResolutionSource;
  kingdom?: string;
  className?: string;
  order?: string;
  iconicTaxonName?: string;
};

const UA = "CEMO-Pixelcore/1.0 (species observation; contact: localhost)";

export function desiredTaxonKingdom(
  interpretation: VisionInterpretation
): "flora" | "fauna" | null {
  const { domain, floraSupport, faunaSupport } = interpretation;
  if (domain === "flora") return "flora";
  if (domain === "fauna") return "fauna";
  if (domain === "mixed") {
    return floraSupport >= faunaSupport ? "flora" : "fauna";
  }
  if (domain === "unknown") {
    if (Math.abs(floraSupport - faunaSupport) < 0.02) return null;
    return floraSupport > faunaSupport ? "flora" : "fauna";
  }
  return null;
}

function inatIconMatchesKingdom(
  iconicTaxonName: string | null | undefined,
  desired: "flora" | "fauna" | null
): boolean {
  if (!desired) return true;
  const i = (iconicTaxonName ?? "").toLowerCase();
  if (!i) return true;
  if (desired === "flora") {
    return i === "plantae" || i === "fungi" || i === "chromista";
  }
  if (i === "plantae" || i === "fungi") return false;
  return true;
}

function querySpecificityBonus(text: string): number {
  const t = text.trim();
  const wc = t.split(/\s+/).filter(Boolean).length;
  let bonus = 0;
  if (wc >= 2) bonus += (wc - 1) * 85;
  if (t.length > 14) bonus += Math.min(100, (t.length - 14) * 3);
  if (wc === 1 && t.length <= 5) bonus -= 120;
  else if (wc === 1 && t.length <= 8) bonus -= 45;
  return bonus;
}

export function pickTaxonSearchQueries(interpretation: VisionInterpretation): string[] {
  type Cand = { text: string; weight: number };
  const cands: Cand[] = [];

  for (const w of interpretation.webEntities) {
    const text = w.description.trim();
    if (text.length < 2) continue;
    cands.push({
      text,
      weight: 1000 * w.score + querySpecificityBonus(text),
    });
  }

  for (const a of interpretation.alternateIdentifications) {
    const text = a.name.trim();
    if (text.length < 2) continue;
    cands.push({
      text,
      weight: 780 * a.score + querySpecificityBonus(text),
    });
  }

  const primary = interpretation.primaryIdentification.trim();
  if (primary.length >= 2) {
    cands.push({
      text: primary,
      weight: 520 * interpretation.primaryScore + querySpecificityBonus(primary),
    });
  }

  for (const s of interpretation.floraSignals) {
    const text = s.trim();
    if (text.length < 2) continue;
    cands.push({ text, weight: 360 + querySpecificityBonus(text) });
  }
  for (const s of interpretation.faunaSignals) {
    const text = s.trim();
    if (text.length < 2) continue;
    cands.push({ text, weight: 360 + querySpecificityBonus(text) });
  }

  cands.sort((a, b) => b.weight - a.weight);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const { text } of cands) {
    const norm = text.replace(/\s+/g, " ").trim().slice(0, 120);
    const k = norm.toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(norm);
    if (out.length >= 24) break;
  }
  return out;
}

export function pickTaxonSearchQuery(interpretation: VisionInterpretation): string {
  const qs = pickTaxonSearchQueries(interpretation);
  return qs[0] ?? interpretation.primaryIdentification.trim();
}

async function resolveTaxonGbif(
  query: string,
  desired: "flora" | "fauna" | null
): Promise<TaxonResolution | null> {
  const url = new URL("https://api.gbif.org/v1/species/search");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "10");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": UA,
      },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      results?: Array<{
        canonicalName?: string;
        scientificName?: string;
        rank?: string;
        kingdom?: string;
        class?: string;
        order?: string;
        taxonomicStatus?: string;
      }>;
    };

    for (const r of data.results ?? []) {
      const sci = r.canonicalName?.trim();
      if (!sci) continue;

      const rank = (r.rank || "").toUpperCase();
      if (!["SPECIES", "SUBSPECIES", "VARIETY", "FORM"].includes(rank)) continue;

      if (r.taxonomicStatus === "DOUBTFUL") continue;

      if (desired) {
        const k = r.kingdom?.toLowerCase();
        if (desired === "flora" && k && k !== "plantae" && k !== "fungi") continue;
        if (desired === "fauna" && k && k !== "animalia") continue;
      }

      const common = query.replace(/\b\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

      return {
        commonName: common,
        scientificName: sci,
        source: "gbif",
        kingdom: r.kingdom,
        className: r.class,
        order: r.order,
      };
    }
  } catch (e) {
    return null;
  }
  return null;
}

async function resolveTaxonInaturalist(
  query: string,
  desired: "flora" | "fauna" | null
): Promise<TaxonResolution | null> {
  const url = new URL("https://api.inaturalist.org/v1/taxa");
  url.searchParams.set("q", query);
  url.searchParams.set("per_page", "10");
  url.searchParams.set("is_active", "true");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": UA,
      },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      results?: Array<{
        name?: string;
        preferred_common_name?: string | null;
        rank?: string;
        iconic_taxon_name?: string | null;
      }>;
    };

    for (const r of data.results ?? []) {
      const sci = r.name?.trim();
      if (!sci) continue;

      const rank = (r.rank || "").toLowerCase();
      if (!["species", "subspecies", "variety", "form"].includes(rank)) continue;

      const commonLower = (r.preferred_common_name || "").toLowerCase();
      const labelLower = query.toLowerCase();
      const nameLower = sci.toLowerCase();

      const isMatch =
        commonLower.includes(labelLower) ||
        labelLower.includes(commonLower) ||
        nameLower.includes(labelLower) ||
        nameLower.includes("canis"); // fallback for dogs

      if (!isMatch && commonLower !== "") continue;

      if (!inatIconMatchesKingdom(r.iconic_taxon_name, desired)) continue;

      const common =
        r.preferred_common_name?.trim() ||
        query.replace(/\b\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

      return {
        commonName: common,
        scientificName: sci,
        source: "inaturalist",
        iconicTaxonName: r.iconic_taxon_name ?? undefined,
        kingdom: r.iconic_taxon_name === "Plantae" ? "Plantae" : "Animalia",
      };
    }
  } catch (e) {
    return null;
  }

  return null;
}

function normalizeAiLabel(label: string): string {
  const text = label.toLowerCase().trim();

  const dogBreeds = [
    "labrador retriever",
    "golden retriever",
    "german shepherd",
    "bulldog",
    "poodle",
    "rottweiler",
    "beagle",
    "chihuahua",
    "shih tzu",
    "siberian husky",
    "rhodesian ridgeback",
    "redbone coonhound",
    "broholmer",
  ];

  if (dogBreeds.some((breed) => text.includes(breed))) {
    return "dog";
  }

  const catBreeds = [
    "persian cat",
    "siamese cat",
    "maine coon",
    "ragdoll",
    "british shorthair",
  ];

  if (catBreeds.some((breed) => text.includes(breed))) {
    return "cat";
  }

  return label;
}

async function resolveOneQuery(
  q: string,
  desired: "flora" | "fauna" | null
): Promise<TaxonResolution | null> {
  const trimmed = q.trim();
  if (!trimmed) return null;

  const normalized = normalizeAiLabel(trimmed);
  const lowerNormalized = normalized.toLowerCase();

  const manualMap: Record<string, Omit<TaxonResolution, "commonName"> & { commonName?: string }> = {
    dog: {
      source: "manual",
      scientificName: "Canis lupus familiaris",
      kingdom: "Animalia",
      className: "Mammalia",
    },
    cat: {
      source: "manual",
      scientificName: "Felis catus",
      kingdom: "Animalia",
      className: "Mammalia",
    },
  };

  if (manualMap[lowerNormalized]) {
    const mapped = manualMap[lowerNormalized];
    return {
      source: mapped.source,
      scientificName: mapped.scientificName,
      kingdom: mapped.kingdom,
      className: mapped.className,
      commonName: mapped.commonName || "",
    };
  }

  const fromInat = await resolveTaxonInaturalist(normalized, desired);
  if (fromInat) return fromInat;

  const fromGbif = await resolveTaxonGbif(normalized, desired);
  if (fromGbif) return fromGbif;

  return null;
}

export async function resolveTaxonFromVision(
  interpretation: VisionInterpretation,
  options?: { googleKgApiKey?: string }
): Promise<TaxonResolution | null> {
  const queries = pickTaxonSearchQueries(interpretation);
  if (queries.length === 0) return null;

  const desired = desiredTaxonKingdom(interpretation);

  for (const q of queries) {
    const hit = await resolveOneQuery(q, desired);
    if (hit) return hit;
  }
  return null;
}
