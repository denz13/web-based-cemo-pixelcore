import type { VisionInterpretation } from "@/src/lib/visionInterpretation";

export type TaxonResolutionSource =
  | "google_kg"
  | "wikidata"
  | "inaturalist"
  | "wikipedia";

export type TaxonResolution = {
  commonName: string;
  scientificName: string;
  source: TaxonResolutionSource;
};

const UA = "CEMO-Pixelcore/1.0 (species observation; contact: localhost)";

/** Wikidata roots to avoid cross-kingdom false positives (e.g. Flower + Macaca) */
const WIKIDATA_ANIMALIA = new Set(["Q729"]);
const WIKIDATA_PLANT_LINEAGE = new Set([
  "Q756", // Plantae
  "Q188104", // Viridiplantae
  "Q764", // Fungi (mapped to “flora” side for this app)
  "Q7152815", // Chlorophyta / green algae — often Flora
  "Q25341", // Angiosperms / flowering plants (common intermediate)
]);

const entityKingdomMemo = new Map<string, "flora" | "fauna" | "unknown">();

/** Align taxon DB results with Vision flora/fauna signals (null = skip check). */
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

function kingdomHintCompatible(
  found: "flora" | "fauna" | "unknown",
  desired: "flora" | "fauna" | null
): boolean {
  if (!desired) return true;
  /** Still reject clear cross-kingdom matches; allow unknown so P171 gaps don't blank Scientific Name */
  if (found === "unknown") return true;
  if (found === "fauna" && desired === "flora") return false;
  if (found === "flora" && desired === "fauna") return false;
  return true;
}

async function wikidataFirstParent171(entityId: string): Promise<string | null> {
  const entityUrl = new URL("https://www.wikidata.org/w/api.php");
  entityUrl.searchParams.set("action", "wbgetentities");
  entityUrl.searchParams.set("ids", entityId);
  entityUrl.searchParams.set("props", "claims");
  entityUrl.searchParams.set("format", "json");

  const entRes = await fetch(entityUrl.toString(), {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  const entData = (await entRes.json()) as {
    entities?: Record<
      string,
      {
        claims?: {
          P171?: Array<{ mainsnak?: { datavalue?: { value?: { id?: string } } } }>;
        };
      }
    >;
  };

  const entity = entData.entities?.[entityId];
  const parentId = entity?.claims?.P171?.[0]?.mainsnak?.datavalue?.value?.id;
  return parentId && /^Q\d+$/.test(parentId) ? parentId : null;
}

/** Walk taxon parent chain (P171) until Animalia / Plantae-side or unknown */
export async function wikidataKingdomSideFromEntity(
  startId: string
): Promise<"flora" | "fauna" | "unknown"> {
  if (entityKingdomMemo.has(startId)) {
    return entityKingdomMemo.get(startId)!;
  }

  async function resolve(id: string, stack: Set<string>): Promise<"flora" | "fauna" | "unknown"> {
    if (entityKingdomMemo.has(id)) return entityKingdomMemo.get(id)!;
    if (stack.has(id)) return "unknown";
    stack.add(id);

    if (WIKIDATA_ANIMALIA.has(id)) {
      entityKingdomMemo.set(id, "fauna");
      return "fauna";
    }
    if (WIKIDATA_PLANT_LINEAGE.has(id)) {
      entityKingdomMemo.set(id, "flora");
      return "flora";
    }

    const parent = await wikidataFirstParent171(id);
    if (!parent) {
      entityKingdomMemo.set(id, "unknown");
      return "unknown";
    }
    const k = await resolve(parent, stack);
    entityKingdomMemo.set(id, k);
    return k;
  }

  return resolve(startId, new Set());
}

async function enwikiWikibaseItem(pageTitle: string): Promise<string | null> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("titles", pageTitle);
  url.searchParams.set("prop", "pageprops");
  url.searchParams.set("ppprop", "wikibase_item");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  const data = (await res.json()) as {
    query?: {
      pages?: Record<string, { pageprops?: { wikibase_item?: string } } | { missing?: string }>;
    };
  };
  const pages = data.query?.pages ?? {};
  for (const p of Object.values(pages)) {
    if (p && "pageprops" in p && p.pageprops?.wikibase_item) {
      const q = p.pageprops.wikibase_item;
      if (/^Q\d+$/.test(q)) return q;
    }
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

/** Bonus for longer / multi-word Vision strings (more likely species-level); no word blocklist */
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

/** Ordered unique taxon search strings: Vision confidence × string specificity (dynamic). */
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

/** @deprecated use pickTaxonSearchQueries */
export function pickTaxonSearchQuery(interpretation: VisionInterpretation): string {
  const qs = pickTaxonSearchQueries(interpretation);
  return qs[0] ?? interpretation.primaryIdentification.trim();
}

const BINOMIAL_PARENS = /\(\s*([A-Z][a-z]+)\s+([a-z][a-z-]+)\s*\)/;
const BINOMIAL_START = /^([A-Z][a-z]+)\s+([a-z][a-z-]+)\b/;

export function extractBinomialFromText(text: string): string | null {
  const t = text.replace(/\s+/g, " ").trim();
  const paren = BINOMIAL_PARENS.exec(t);
  if (paren) return `${paren[1]} ${paren[2]}`;
  const start = BINOMIAL_START.exec(t);
  if (start) return `${start[1]} ${start[2]}`;
  return null;
}

async function resolveTaxonGoogleKg(
  query: string,
  apiKey: string,
  desired: "flora" | "fauna" | null
): Promise<TaxonResolution | null> {
  const url = new URL("https://kgsearch.googleapis.com/v1/entities:search");
  url.searchParams.set("query", query);
  url.searchParams.set("limit", "4");
  url.searchParams.set("languages", "en");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  const data = (await res.json()) as {
    itemListElement?: Array<{
      result?: {
        name?: string;
        detailedDescription?: { articleBody?: string; url?: string };
      };
    }>;
  };

  for (const el of data.itemListElement ?? []) {
    const result = el.result;
    const name = result?.name?.trim();
    const body = result?.detailedDescription?.articleBody;
    if (!name || !body) continue;
    const scientific = extractBinomialFromText(body);
    if (!scientific) continue;

    if (desired) {
      const wikiUrl = result.detailedDescription?.url;
      const m = wikiUrl?.match(/en\.wikipedia\.org\/wiki\/([^#?]+)/i);
      if (!m) continue;
      const title = decodeURIComponent(m[1].replace(/_/g, " "));
      const qid = await enwikiWikibaseItem(title);
      if (!qid) continue;
      const side = await wikidataKingdomSideFromEntity(qid);
      if (!kingdomHintCompatible(side, desired)) continue;
    }

    return {
      commonName: name,
      scientificName: scientific,
      source: "google_kg",
    };
  }
  return null;
}

async function resolveTaxonWikidata(
  query: string,
  desired: "flora" | "fauna" | null
): Promise<TaxonResolution | null> {
  const searchUrl = new URL("https://www.wikidata.org/w/api.php");
  searchUrl.searchParams.set("action", "wbsearchentities");
  searchUrl.searchParams.set("search", query);
  searchUrl.searchParams.set("language", "en");
  searchUrl.searchParams.set("type", "item");
  searchUrl.searchParams.set("format", "json");
  searchUrl.searchParams.set("limit", "12");

  const searchRes = await fetch(searchUrl.toString(), {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  const searchData = (await searchRes.json()) as {
    search?: Array<{ id: string; label?: string }>;
  };

  const hits = searchData.search ?? [];
  for (const hit of hits) {
    const id = hit.id;
    if (!id) continue;

    const entityUrl = new URL("https://www.wikidata.org/w/api.php");
    entityUrl.searchParams.set("action", "wbgetentities");
    entityUrl.searchParams.set("ids", id);
    entityUrl.searchParams.set("props", "labels|claims");
    entityUrl.searchParams.set("languages", "en");
    entityUrl.searchParams.set("format", "json");

    const entRes = await fetch(entityUrl.toString(), {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    const entData = (await entRes.json()) as {
      entities?: Record<
        string,
        {
          labels?: { en?: { value?: string } };
          claims?: {
            P225?: Array<{ mainsnak?: { datavalue?: { value?: unknown } } }>;
          };
        }
      >;
    };

    const entity = entData.entities?.[id];
    const scientificRaw = entity?.claims?.P225?.[0]?.mainsnak?.datavalue?.value;
    if (typeof scientificRaw !== "string" || !scientificRaw.trim()) continue;
    const sciTrim = scientificRaw.trim();
    if (!/^[A-Z][a-z]+ [a-z][a-z-]+/.test(sciTrim)) continue;

    const side = await wikidataKingdomSideFromEntity(id);
    if (!kingdomHintCompatible(side, desired)) continue;

    const label = entity?.labels?.en?.value?.trim() || hit.label?.trim() || query;
    return {
      commonName: label,
      scientificName: sciTrim,
      source: "wikidata",
    };
  }

  return null;
}

/** English Wikipedia summary — often first sentence has (Genus species); no API key */
async function resolveTaxonWikipedia(
  query: string,
  desired: "flora" | "fauna" | null
): Promise<TaxonResolution | null> {
  const encoded = encodeURIComponent(query.trim().replace(/\s+/g, "_"));
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { extract?: string; title?: string };
  const extract = data.extract?.trim() ?? "";
  if (!extract) return null;

  if (desired) {
    const title = data.title?.trim() || query.trim();
    const qid = await enwikiWikibaseItem(title);
    if (qid) {
      const side = await wikidataKingdomSideFromEntity(qid);
      if (!kingdomHintCompatible(side, desired)) return null;
    }
  }

  const scientific = extractBinomialFromText(extract);
  if (!scientific) return null;
  return {
    commonName: data.title?.trim() || query,
    scientificName: scientific,
    source: "wikipedia",
  };
}

async function resolveTaxonInaturalist(
  query: string,
  desired: "flora" | "fauna" | null
): Promise<TaxonResolution | null> {
  const url = new URL("https://api.inaturalist.org/v1/taxa");
  url.searchParams.set("q", query);
  url.searchParams.set("per_page", "10");
  url.searchParams.set("is_active", "true");

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

  const binomialish = /^[A-Z][a-z]+(?:\s+[a-z][a-z-]+)+$/;

  for (const r of data.results ?? []) {
    const sci = r.name?.trim();
    if (!sci || !binomialish.test(sci)) continue;
    if (!inatIconMatchesKingdom(r.iconic_taxon_name, desired)) continue;
    const rank = r.rank?.toLowerCase() ?? "";
    if (rank && rank !== "species" && rank !== "hybrid" && rank !== "subspecies") continue;

    const common =
      r.preferred_common_name?.trim() ||
      query.replace(/\b\w+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

    return {
      commonName: common,
      scientificName: sci,
      source: "inaturalist",
    };
  }

  return null;
}

async function resolveOneQuery(
  q: string,
  googleKey: string | undefined,
  desired: "flora" | "fauna" | null
): Promise<TaxonResolution | null> {
  const trimmed = q.trim();
  if (!trimmed) return null;

  if (googleKey) {
    const fromKg = await resolveTaxonGoogleKg(trimmed, googleKey, desired);
    if (fromKg) return fromKg;
  }

  const fromWd = await resolveTaxonWikidata(trimmed, desired);
  if (fromWd) return fromWd;

  const fromInat = await resolveTaxonInaturalist(trimmed, desired);
  if (fromInat) return fromInat;

  return resolveTaxonWikipedia(trimmed, desired);
}

export async function resolveTaxonFromVision(
  interpretation: VisionInterpretation,
  options?: { googleKgApiKey?: string }
): Promise<TaxonResolution | null> {
  const queries = pickTaxonSearchQueries(interpretation);
  if (queries.length === 0) return null;

  const googleKey = options?.googleKgApiKey?.trim();
  const desired = desiredTaxonKingdom(interpretation);

  for (const q of queries) {
    const hit = await resolveOneQuery(q, googleKey, desired);
    if (hit) return hit;
  }
  return null;
}
