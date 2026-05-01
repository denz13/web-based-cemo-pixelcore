import { NextRequest, NextResponse } from "next/server";

import {
  interpretVisionResults,
  type VisionInterpretation,
  type VisionLabel,
  type VisionObject,
} from "@/src/lib/visionInterpretation";
import { resolveTaxonFromVision, type TaxonResolution } from "@/lib/taxon-resolve";

/** ~4.5 MB raw image upper bound (base64 expands ~4/3). */
const MAX_BASE64_CHARS = 6_500_000;

function getVisionApiKey(): string {
  return (
    process.env.GOOGLE_CLOUD_VISION_API_KEY?.trim() ||
    process.env.GOOGLE_VISION_API_KEY?.trim() ||
    ""
  );
}

function getGoogleKgApiKey(): string | undefined {
  const k = process.env.GOOGLE_KNOWLEDGE_GRAPH_API_KEY?.trim();
  return k || undefined;
}

/** Lightweight check for the UI (does not expose the key). */
export async function GET() {
  const configured = Boolean(getVisionApiKey());
  return NextResponse.json({
    visionKeyConfigured: configured,
    hint: configured
      ? null
      : "Add GOOGLE_CLOUD_VISION_API_KEY to .env.local in the project root, then restart `next dev`.",
  });
}

export async function POST(req: NextRequest) {
  const apiKey = getVisionApiKey();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Vision API key missing on server. Create `.env.local` in the project root with GOOGLE_CLOUD_VISION_API_KEY=your_key and restart `npm run dev`.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const imageBase64 =
    typeof body === "object" &&
    body !== null &&
    "imageBase64" in body &&
    typeof (body as { imageBase64: unknown }).imageBase64 === "string"
      ? (body as { imageBase64: string }).imageBase64.trim()
      : "";

  if (!imageBase64) {
    return NextResponse.json(
      { error: "Missing imageBase64 (raw base64 or data URL)" },
      { status: 400 }
    );
  }

  const base64 = imageBase64.includes(",")
    ? imageBase64.slice(imageBase64.indexOf(",") + 1)
    : imageBase64;

  if (base64.length > MAX_BASE64_CHARS) {
    return NextResponse.json(
      { error: "Image too large; use a smaller file." },
      { status: 413 }
    );
  }

  const url = new URL("https://vision.googleapis.com/v1/images:annotate");
  url.searchParams.set("key", apiKey);

  const visionRes = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64 },
          features: [
            { type: "LABEL_DETECTION", maxResults: 25 },
            { type: "OBJECT_LOCALIZATION", maxResults: 10 },
            { type: "WEB_DETECTION", maxResults: 12 },
          ],
        },
      ],
    }),
  });

  const data = (await visionRes.json()) as {
    error?: { message?: string };
    responses?: Array<{
      error?: { message?: string };
      labelAnnotations?: Array<{ description: string; score: number }>;
      localizedObjectAnnotations?: Array<{ name: string; score: number }>;
      webDetection?: {
        webEntities?: Array<{ description?: string; score?: number }>;
      };
    }>;
  };

  if (!visionRes.ok) {
    const msg =
      data?.error?.message ??
      (typeof data === "object" ? JSON.stringify(data) : "Vision request failed");
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const first = data.responses?.[0];
  if (first?.error?.message) {
    return NextResponse.json({ error: first.error.message }, { status: 502 });
  }

  const labels: VisionLabel[] = (first?.labelAnnotations ?? []).map((l) => ({
    description: l.description,
    score: Math.round(l.score * 1000) / 1000,
  }));

  const objects: VisionObject[] = (first?.localizedObjectAnnotations ?? []).map(
    (o) => ({
      name: o.name,
      score: Math.round(o.score * 1000) / 1000,
    })
  );

  const interpretation: VisionInterpretation = interpretVisionResults(
    labels,
    objects,
    first?.webDetection?.webEntities
  );

  let taxon: TaxonResolution | null = null;
  try {
    taxon = await resolveTaxonFromVision(interpretation, {
      googleKgApiKey: getGoogleKgApiKey(),
    });
  } catch {
    taxon = null;
  }

  return NextResponse.json({ labels, objects, interpretation, taxon });
}
