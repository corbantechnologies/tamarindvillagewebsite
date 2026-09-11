import React, { useState, useEffect } from "react";
import { getOptimizedImageUrl, getOriginalFallbackUrl, PresetName, ImagePresetOptions } from "../utils/media";

export interface OptimizedImageProps {
  src: string;
  preset?: PresetName | ImagePresetOptions;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
  loading?: "lazy" | "eager";
  decoding?: "async" | "auto" | "sync";
  referrerPolicy?: React.HTMLAttributeReferrerPolicy;
  onClick?: React.MouseEventHandler<HTMLImageElement>;
  onError?: React.ReactEventHandler<HTMLImageElement>;
  onLoad?: React.ReactEventHandler<HTMLImageElement>;
  [key: string]: any;
}

export default function OptimizedImage({
  src,
  preset = "card",
  fallbackSrc,
  alt,
  className,
  loading = "lazy",
  onError,
  ...rest
}: OptimizedImageProps) {
  const optimizedUrl = getOptimizedImageUrl(src, preset);
  const directFallback = fallbackSrc || getOriginalFallbackUrl(src) || src;

  const [currentSrc, setCurrentSrc] = useState(optimizedUrl);
  const [hasErrored, setHasErrored] = useState(false);

  // If the source prop changes, re-evaluate optimized URL
  useEffect(() => {
    setCurrentSrc(getOptimizedImageUrl(src, preset));
    setHasErrored(false);
  }, [src, preset]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasErrored && currentSrc !== directFallback) {
      console.warn(`[imgproxy fallback] Failed to load ${currentSrc}. Reverting to direct MinIO origin: ${directFallback}`);
      setHasErrored(true);
      setCurrentSrc(directFallback);
    }
    if (onError) {
      onError(e);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={handleError}
      {...rest}
    />
  );
}
