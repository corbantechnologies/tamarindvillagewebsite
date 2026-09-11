/**
 * Media Delivery & Image Optimization Utility for Tamarind Village.
 * 
 * Routes media assets through our self-hosted imgproxy instance (https://tml-files.tamarind.co.ke)
 * with tuned presets for device pixel ratio (DPR), WebP formatting, quality, and sharpening.
 * Preserves canonical master URLs (https://media.tamarind.co.ke/tvl-website-assets/...) in all data models.
 */

export const IMGPROXY_BASE = "https://tml-files.tamarind.co.ke/insecure";
export const MINIO_HOST = "media.tamarind.co.ke";
export const BUCKET_NAME = "tvl-website-assets";

export interface ImagePresetOptions {
  width?: number;
  height?: number;
  dpr?: number;
  quality?: number;
  sharpen?: number;
  format?: "webp" | "avif" | "jpg";
  resizingType?: "fit" | "fill" | "auto";
}

export type PresetName = "hero" | "gallery" | "card" | "thumb" | "fullscreen";

export const MEDIA_PRESETS: Record<PresetName, ImagePresetOptions> = {
  // Hero section slideshow & immersive full-bleed displays
  hero: { 
    width: 1920, 
    height: 1080, 
    dpr: 1.5, 
    quality: 88, 
    sharpen: 0.35, 
    format: "webp",
    resizingType: "fit"
  },
  // Main showcase photo on apartment and dining detail views
  gallery: { 
    width: 1600, 
    height: 0, 
    dpr: 1.5, 
    quality: 86, 
    sharpen: 0.4, 
    format: "webp",
    resizingType: "fit"
  },
  // Homepage suite, dining, facility & event cards
  card: { 
    width: 800, 
    height: 550, 
    dpr: 2, 
    quality: 84, 
    sharpen: 0.4, 
    format: "webp",
    resizingType: "fill"
  },
  // Gallery thumbnails and admin preview thumbnails
  thumb: { 
    width: 400, 
    height: 280, 
    dpr: 2, 
    quality: 82, 
    sharpen: 0.5, 
    format: "webp",
    resizingType: "fill"
  },
  // Lightbox and maximum high-definition modal viewers
  fullscreen: { 
    width: 2200, 
    height: 0, 
    dpr: 1.25, 
    quality: 90, 
    sharpen: 0.25, 
    format: "webp",
    resizingType: "fit"
  }
};

/**
 * Transforms a canonical MinIO URL into an optimized imgproxy URL.
 * If the URL is external (Unsplash, local assets, etc.) or already transformed,
 * it returns the original URL unchanged.
 */
export function getOptimizedImageUrl(
  url: string | undefined | null,
  presetOrOptions: PresetName | ImagePresetOptions = "gallery"
): string {
  if (!url || typeof url !== "string") return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  // 1. Leave local relative assets (e.g. /assets/logo.png) as is
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  // 2. If already an imgproxy URL, return as is
  if (trimmed.includes("tml-files.tamarind.co.ke")) {
    return trimmed;
  }

  // 3. Check if this is a MinIO asset from our bucket
  let objectKey: string | null = null;

  if (trimmed.includes(MINIO_HOST) && trimmed.includes(BUCKET_NAME)) {
    // Matches https://media.tamarind.co.ke/tvl-website-assets/PATH...
    const match = trimmed.match(new RegExp(`https?://${MINIO_HOST}/${BUCKET_NAME}/(.*)`));
    if (match && match[1]) {
      objectKey = match[1];
    }
  } else if (trimmed.startsWith(`s3://${BUCKET_NAME}/`)) {
    objectKey = trimmed.replace(`s3://${BUCKET_NAME}/`, "");
  }

  // If not our MinIO asset (e.g. Unsplash, external link), return original as-is
  if (!objectKey) {
    return trimmed;
  }

  // Clean any leading slashes or query parameters from object key
  const cleanKey = objectKey.replace(/^\/+/, "").split("?")[0];

  // Resolve options
  const options: ImagePresetOptions = 
    typeof presetOrOptions === "string" 
      ? MEDIA_PRESETS[presetOrOptions] || MEDIA_PRESETS.gallery 
      : presetOrOptions;

  const width = options.width ?? 1200;
  const height = options.height ?? 0;
  const dpr = options.dpr ?? 1.5;
  const quality = options.quality ?? 86;
  const sharpen = options.sharpen ?? 0.4;
  const format = options.format ?? "webp";
  const resizingType = options.resizingType ?? "fit";

  const s3Uri = `s3://${BUCKET_NAME}/${cleanKey}`;
  return `${IMGPROXY_BASE}/resize:${resizingType}:${width}:${height}/dpr:${dpr}/q:${quality}/sh:${sharpen}/plain/${s3Uri}@${format}`;
}

/**
 * Extracts the canonical MinIO fallback URL from any imgproxy URL.
 */
export function getOriginalFallbackUrl(url: string): string {
  if (!url) return "";
  if (!url.includes("tml-files.tamarind.co.ke")) return url;

  // Pattern: .../plain/s3://tvl-website-assets/KEY@webp
  const s3Match = url.match(/plain\/s3:\/\/([^\/@]+)\/([^@]+)(?:@\w+)?$/);
  if (s3Match && s3Match[1] && s3Match[2]) {
    return `https://${MINIO_HOST}/${s3Match[1]}/${s3Match[2]}`;
  }

  return url;
}
