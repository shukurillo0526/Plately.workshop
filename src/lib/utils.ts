import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Optimizes image URLs by appending transform parameters when hosted on Supabase Storage.
 */
export function getOptimizedImageUrl(
  url?: string | null,
  options: { width?: number; height?: number; quality?: number; format?: 'origin' } = {}
): string | undefined {
  if (!url) return undefined;
  if (!url.includes('/storage/v1/object/public/')) return url;

  // Supabase Image Transformation parameters
  const params = new URLSearchParams();
  if (options.width) params.set('width', options.width.toString());
  if (options.height) params.set('height', options.height.toString());
  params.set('quality', (options.quality ?? 80).toString());

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${params.toString()}`;
}

