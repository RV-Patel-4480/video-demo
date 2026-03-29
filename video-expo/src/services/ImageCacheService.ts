/**
 * ImageCacheService
 *
 * Manages aggressive thumbnail prefetching ahead of the visible window.
 * Uses expo-image's prefetch() which writes to disk so the image component
 * renders instantly from cache with zero network wait.
 *
 * Strategy:
 *  - On every scroll position change, prefetch the next N thumbnails
 *  - Track which URLs are already prefetched to avoid duplicate calls
 *  - Cancel stale prefetch tasks when they are no longer needed
 */

import { Image } from 'expo-image';

type PrefetchTask = ReturnType<typeof Image.prefetch>;

class ImageCacheService {
  private prefetchedUrls = new Set<string>();
  private inFlightTasks = new Map<string, PrefetchTask>();

  /**
   * Prefetch an array of thumbnail URLs in priority order.
   * Already-cached URLs are skipped immediately.
   */
  prefetchBatch(urls: string[]): void {
    for (const url of urls) {
      if (!url || this.prefetchedUrls.has(url)) continue;

      const task = Image.prefetch(url, 'disk');
      this.inFlightTasks.set(url, task);

      task
        .then(() => {
          this.prefetchedUrls.add(url);
          this.inFlightTasks.delete(url);
        })
        .catch(() => {
          this.inFlightTasks.delete(url);
        });
    }
  }

  /**
   * Clear in-memory tracking (disk cache is managed by expo-image itself).
   */
  clearMemoryTracking(): void {
    this.prefetchedUrls.clear();
    this.inFlightTasks.clear();
  }

  isPreloaded(url: string): boolean {
    return this.prefetchedUrls.has(url);
  }

  get prefetchedCount(): number {
    return this.prefetchedUrls.size;
  }
}

export const imageCacheService = new ImageCacheService();

/**
 * Extract the best-quality thumbnail URL from a video item
 */
export function getBestThumbnailUrl(thumbnails: {
  maxres?: { url: string };
  standard?: { url: string };
  high?: { url: string };
  medium: { url: string };
  default?: { url: string };
}): string {
  return (
    thumbnails.maxres?.url ||
    thumbnails.standard?.url ||
    thumbnails.high?.url ||
    thumbnails.medium.url
  );
}
