export type PhotoWatermarkLines = {
  /** Large stamp text (e.g. user name) */
  stampLabel: string;
  /** Smaller line inside the stamp frame */
  primary: string;
  secondary?: string;
};

async function loadImageOntoCanvas(
  file: File
): Promise<{ canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  try {
    const bitmap = await createImageBitmap(file);
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();
    return { canvas, ctx };
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Image load failed"));
        el.src = url;
      });
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      return { canvas, ctx };
    } catch {
      return null;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  fontFamily: string
): number {
  let size = startSize;
  while (size > 12) {
    ctx.font = `900 ${size}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  }
  return size;
}

/** Small circular stamp — bottom-left (double ring). */
function drawLeftCircleStamp(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  lines: PhotoWatermarkLines
): void {
  const stampLabel = lines.stampLabel.trim().toUpperCase() || "OBS";
  const detail = lines.primary.trim();
  const sub = lines.secondary?.trim() ?? "";

  const w = canvas.width;
  const h = canvas.height;
  const minDim = Math.min(w, h);
  const margin = Math.max(10, Math.round(minDim * 0.022));
  const outerR = Math.max(36, Math.round(minDim * 0.11));
  const innerR = outerR * 0.88;
  const lineW = Math.max(1.5, minDim * 0.0025);

  const cx = margin + outerR;
  const cy = h - margin - outerR;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.08);

  ctx.fillStyle = "rgba(8, 24, 14, 0.65)";
  ctx.beginPath();
  ctx.arc(0, 0, outerR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.88)";
  ctx.lineWidth = lineW;
  ctx.beginPath();
  ctx.arc(0, 0, outerR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, innerR, 0, Math.PI * 2);
  ctx.stroke();

  const fontFamily =
    "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif";
  const maxTextW = innerR * 1.55;

  let mainSize = Math.max(11, Math.round(outerR * 0.28));
  const shortLabel =
    stampLabel.length > 14 ? `${stampLabel.slice(0, 12)}…` : stampLabel;
  mainSize = fitFontSize(ctx, shortLabel, maxTextW, mainSize, fontFamily);

  const detailSize = Math.max(7, Math.round(mainSize * 0.45));
  const subSize = Math.max(6, Math.round(mainSize * 0.38));

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255, 255, 255, 0.97)";

  const hasDetail = Boolean(detail);
  const hasSub = Boolean(sub);
  const lineCount = 1 + (hasDetail ? 1 : 0) + (hasSub ? 1 : 0);
  const lineGap = mainSize * 0.55;
  let textY = -((lineCount - 1) * lineGap) / 2;

  ctx.font = `900 ${mainSize}px ${fontFamily}`;
  ctx.fillText(shortLabel, 0, textY);

  if (hasDetail) {
    textY += lineGap;
    ctx.font = `600 ${detailSize}px system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    const d = detail.length > 22 ? `${detail.slice(0, 20)}…` : detail;
    ctx.fillText(d, 0, textY);
  }

  if (hasSub) {
    textY += lineGap * 0.85;
    ctx.font = `500 ${subSize}px system-ui, sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    const s = sub.length > 24 ? `${sub.slice(0, 22)}…` : sub;
    ctx.fillText(s, 0, textY);
  }

  ctx.restore();
}

/** Burn watermark into image bytes; returns a new File (same type when supported). */
export async function applyPhotoWatermark(
  file: File,
  lines: PhotoWatermarkLines
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const loaded = await loadImageOntoCanvas(file);
  if (!loaded) return file;

  const { canvas, ctx } = loaded;
  if (!lines.stampLabel?.trim() && !lines.primary?.trim()) return file;

  drawLeftCircleStamp(ctx, canvas, lines);

  const mime =
    file.type === "image/png" || file.type === "image/webp"
      ? file.type
      : "image/jpeg";
  const quality = mime === "image/jpeg" ? 0.92 : undefined;

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mime, quality);
  });

  if (!blob) return file;

  const ext =
    mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";

  return new File([blob], `${baseName}-watermarked.${ext}`, {
    type: mime,
    lastModified: Date.now(),
  });
}

export async function applyPhotoWatermarkBatch(
  files: File[],
  lines: PhotoWatermarkLines
): Promise<File[]> {
  return Promise.all(files.map((f) => applyPhotoWatermark(f, lines)));
}
