export type VisionLabel = { description: string; score: number };
export type VisionObject = { name: string; score: number };
export type WebEntity = { description: string; score: number };

export type FloraFaunaDomain = "flora" | "fauna" | "mixed" | "unknown";

export type VisionCandidate = {
  name: string;
  score: number;
  source: "web_entity" | "object" | "label";
};

export type VisionInterpretation = {
  domain: FloraFaunaDomain;
  /** 0–1 rough confidence for domain (relative margin between flora/fauna signals) */
  domainConfidence: number;
  floraSupport: number;
  faunaSupport: number;
  /** Best short answer for “ano ang nasa larawan” */
  primaryIdentification: string;
  primaryScore: number;
  primarySource: "web_entity" | "object" | "label";
  /** Additional likely subjects for multi-object images */
  alternateIdentifications: VisionCandidate[];
  /** Top web entities from Vision (good for specific names) */
  webEntities: WebEntity[];
  /** Labels that strongly pushed flora / fauna (for transparency) */
  floraSignals: string[];
  faunaSignals: string[];
};

const GENERIC_SKIP = new Set(
  [
    "person",
    "people",
    "human",
    "face",
    "photograph",
    "photography",
    "image",
    "picture",
    "sky",
    "cloud",
    "daytime",
    "outdoor",
    "nature",
    "green",
    "lighting",
    "shadow",
    "texture",
    "pattern",
  ].map((s) => s.toLowerCase())
);

const FLORA_PATTERNS: { pattern: RegExp; weight: number }[] = [
  { pattern: /\b(plant|plants|flowering plant|flower|flowers|tree|trees|leaf|leaves|foliage|vegetation|botanical|herb|grass|fern|moss|shrub|bark|branch|branches|trunk|petal|stem|stems|bud|buds|blossom|bloom)\b/i, weight: 1 },
  { pattern: /\b(palm|crops?|vegetable|vegetables|fruit|fruits|orchard|garden|houseplant|cactus|cacti|succulent|woodland|agriculture|flora|botany|stem vegetable)\b/i, weight: 0.9 },
  { pattern: /\b(rose|orchid|lily|oak|maple|bamboo|vine|ivy|seaweed|algae)\b/i, weight: 0.85 },
];

const FAUNA_PATTERNS: { pattern: RegExp; weight: number }[] = [
  { pattern: /\b(animal|animals|bird|birds|mammal|mammals|reptile|reptiles|fish|fishes|amphibian|amphibians|insect|insects|butterfly|butterflies|bee|bees|arthropod|wildlife|fauna)\b/i, weight: 1 },
  { pattern: /\b(dog|dogs|cat|cats|pet|pets|horse|horses|snake|snakes|turtle|turtles|frog|frogs|eagle|eagles|hawk|hawks|owl|owls|chicken|chickens|duck|ducks|goose|geese|pig|pigs|sheep|goat|goats|cattle|cow|cows|bear|bears|lion|tigers?|elephant|elephants|monkey|monkeys|rodent|deer|wolf|wolves|whale|dolphin|shark|crab|spider|spiders|ant|ants)\b/i, weight: 0.95 },
  { pattern: /\b(beak|feather|feathers|fur|paw|paws|wing|wings|tail|nest|zoo|livestock|poultry)\b/i, weight: 0.75 },
];

const CONTAINER_OR_BACKGROUND_PATTERNS: RegExp[] = [
  /\b(flower ?pot|pot|planter|vase|jar|container|basket|tray|table|furniture)\b/i,
  /\b(backyard|garden furniture|yard|patio|floor|wall)\b/i,
];

function isContainerOrBackgroundToken(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  return CONTAINER_OR_BACKGROUND_PATTERNS.some((pattern) => pattern.test(t));
}

function scoreAgainstPatterns(
  text: string,
  score: number,
  patterns: { pattern: RegExp; weight: number }[]
): number {
  let total = 0;
  const t = text.trim();
  if (!t) return 0;
  for (const { pattern, weight } of patterns) {
    if (pattern.test(t)) total += score * weight;
  }
  return total;
}

function isGenericToken(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (GENERIC_SKIP.has(lower)) return true;
  if (lower.length <= 2) return true;
  return false;
}

function accumulateDomainSignals(
  pieces: { text: string; score: number }[]
): { flora: number; fauna: number; floraSignals: string[]; faunaSignals: string[] } {
  let flora = 0;
  let fauna = 0;
  const floraSignals: string[] = [];
  const faunaSignals: string[] = [];

  for (const { text, score } of pieces) {
    if (!text || isGenericToken(text)) continue;
    const fBefore = flora;
    const aBefore = fauna;
    flora += scoreAgainstPatterns(text, score, FLORA_PATTERNS);
    fauna += scoreAgainstPatterns(text, score, FAUNA_PATTERNS);
    if (flora > fBefore) floraSignals.push(text);
    if (fauna > aBefore) faunaSignals.push(text);
  }

  return { flora, fauna, floraSignals, faunaSignals };
}

function pickPrimaryIdentification(
  webEntities: WebEntity[],
  objects: VisionObject[],
  labels: VisionLabel[],
  floraSupport: number,
  faunaSupport: number
): { name: string; score: number; source: VisionInterpretation["primarySource"] } {
  const dominant: FloraFaunaDomain =
    floraSupport > faunaSupport * 1.05
      ? "flora"
      : faunaSupport > floraSupport * 1.05
        ? "fauna"
        : "unknown";

  const rawCandidates: Array<{
    name: string;
    score: number;
    source: VisionInterpretation["primarySource"];
  }> = [
    ...webEntities.map((e) => ({ name: e.description, score: e.score, source: "web_entity" as const })),
    ...objects.map((o) => ({ name: o.name, score: o.score, source: "object" as const })),
    ...labels.map((l) => ({ name: l.description, score: l.score, source: "label" as const })),
  ].filter((c) => c.name && !isGenericToken(c.name) && c.score >= 0.2);

  type AggregatedCandidate = {
    key: string;
    name: string;
    bestScore: number;
    sourceSet: Set<VisionInterpretation["primarySource"]>;
    mentions: number;
    topSource: VisionInterpretation["primarySource"];
  };

  const aggregatedMap = new Map<string, AggregatedCandidate>();
  for (const candidate of rawCandidates) {
    const normalizedName = candidate.name.trim().replace(/\s+/g, " ");
    const key = normalizedName.toLowerCase();
    const existing = aggregatedMap.get(key);
    if (!existing) {
      aggregatedMap.set(key, {
        key,
        name: normalizedName,
        bestScore: candidate.score,
        sourceSet: new Set([candidate.source]),
        mentions: 1,
        topSource: candidate.source,
      });
      continue;
    }
    existing.mentions += 1;
    existing.sourceSet.add(candidate.source);
    if (candidate.score > existing.bestScore) {
      existing.bestScore = candidate.score;
      existing.topSource = candidate.source;
      existing.name = normalizedName;
    }
  }

  const ranked = [...aggregatedMap.values()]
    .map((candidate) => {
      const floraHit = scoreAgainstPatterns(candidate.name, 1, FLORA_PATTERNS);
      const faunaHit = scoreAgainstPatterns(candidate.name, 1, FAUNA_PATTERNS);
      const sourceBias =
        candidate.topSource === "web_entity"
          ? 0.1
          : candidate.topSource === "object"
            ? 0.05
            : 0.02;
      const domainBoost =
        dominant === "flora" ? floraHit * 0.24 : dominant === "fauna" ? faunaHit * 0.24 : 0;
      const semanticBoost = Math.max(floraHit, faunaHit) * 0.12;
      const consensusBoost =
        Math.min(0.2, (candidate.mentions - 1) * 0.05) +
        Math.min(0.1, (candidate.sourceSet.size - 1) * 0.05);
      const containerPenalty = isContainerOrBackgroundToken(candidate.name) ? 0.3 : 0;
      const finalScore =
        candidate.bestScore +
        sourceBias +
        domainBoost +
        semanticBoost +
        consensusBoost -
        containerPenalty;

      return {
        name: candidate.name,
        score: candidate.bestScore,
        source: candidate.topSource,
        mentions: candidate.mentions,
        sourceDiversity: candidate.sourceSet.size,
        finalScore,
      };
    })
    .sort((a, b) => {
      if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
      if (b.mentions !== a.mentions) return b.mentions - a.mentions;
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    });

  const top = ranked[0];
  if (top) {
    return {
      name: top.name,
      score: top.score,
      source: top.source,
    };
  }

  const fallback = labels.sort((a, b) => b.score - a.score)[0];
  if (fallback) {
    return {
      name: fallback.description,
      score: fallback.score,
      source: "label",
    };
  }

  return { name: "Hindi matukoy ang subject", score: 0, source: "label" };
}

function collectAlternateIdentifications(
  webEntities: WebEntity[],
  objects: VisionObject[],
  labels: VisionLabel[],
  primaryName: string
): VisionCandidate[] {
  const normalize = (value: string) => value.trim().toLowerCase();
  const seen = new Set<string>([normalize(primaryName)]);
  const candidates: VisionCandidate[] = [];

  const pushCandidate = (
    name: string,
    score: number,
    source: VisionCandidate["source"]
  ) => {
    const normalized = normalize(name);
    if (!normalized || seen.has(normalized) || isGenericToken(normalized)) return;
    if (score < 0.25) return;
    seen.add(normalized);
    candidates.push({
      name: name.trim(),
      score: Math.round(score * 1000) / 1000,
      source,
    });
  };

  for (const entity of webEntities) {
    pushCandidate(entity.description, entity.score, "web_entity");
  }
  for (const obj of objects) {
    pushCandidate(obj.name, obj.score, "object");
  }
  for (const label of labels) {
    pushCandidate(label.description, label.score, "label");
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, 5);
}

function resolveDomain(
  flora: number,
  fauna: number
): { domain: FloraFaunaDomain; domainConfidence: number } {
  const sum = flora + fauna;
  if (sum < 0.08) {
    return { domain: "unknown", domainConfidence: 0 };
  }
  const margin = Math.abs(flora - fauna) / (sum + 1e-6);
  if (margin < 0.12 && flora > 0.05 && fauna > 0.05) {
    return { domain: "mixed", domainConfidence: 1 - margin };
  }
  if (flora > fauna * 1.12) {
    return { domain: "flora", domainConfidence: Math.min(1, margin + 0.35) };
  }
  if (fauna > flora * 1.12) {
    return { domain: "fauna", domainConfidence: Math.min(1, margin + 0.35) };
  }
  return { domain: "unknown", domainConfidence: margin };
}

export function interpretVisionResults(
  labels: VisionLabel[],
  objects: VisionObject[],
  webEntitiesRaw: Array<{ description?: string; score?: number }> | undefined
): VisionInterpretation {
  const webEntities: WebEntity[] = (webEntitiesRaw ?? [])
    .map((e) => ({
      description: (e.description ?? "").trim(),
      score: typeof e.score === "number" ? e.score : 0,
    }))
    .filter((e) => e.description.length > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  const pieces: { text: string; score: number }[] = [
    ...labels.map((l) => ({ text: l.description, score: l.score })),
    ...objects.map((o) => ({ text: o.name, score: o.score })),
    ...webEntities.map((w) => ({ text: w.description, score: w.score })),
  ];

  const { flora, fauna, floraSignals, faunaSignals } = accumulateDomainSignals(pieces);
  const { domain, domainConfidence } = resolveDomain(flora, fauna);

  const primary = pickPrimaryIdentification(webEntities, objects, labels, flora, fauna);
  const alternateIdentifications = collectAlternateIdentifications(
    webEntities,
    objects,
    labels,
    primary.name
  );

  return {
    domain,
    domainConfidence,
    floraSupport: Math.round(flora * 1000) / 1000,
    faunaSupport: Math.round(fauna * 1000) / 1000,
    primaryIdentification: primary.name,
    primaryScore: Math.round(primary.score * 1000) / 1000,
    primarySource: primary.source,
    alternateIdentifications,
    webEntities,
    floraSignals: [...new Set(floraSignals)].slice(0, 8),
    faunaSignals: [...new Set(faunaSignals)].slice(0, 8),
  };
}
