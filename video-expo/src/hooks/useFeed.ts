/**
 * useFeed
 *
 * Single source of truth for the video feed. Handles:
 *  - Paginated API calls with dedup guard
 *  - Image prefetching N items ahead of visible index
 *  - Reporting scroll position to VideoPreloadManager
 *  - Exposing current autoplay index derived from viewability callbacks
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Video, fetchVideos } from '../services/api';
import { imageCacheService, getBestThumbnailUrl } from '../services/ImageCacheService';
import { videoPreloadManager } from '../services/VideoPreloadManager';
import {
  IMAGE_PREFETCH_AHEAD,
  PAGE_LIMIT,
} from '../constants';

interface UseFeedOptions {
  query: string;
}

interface UseFeedReturn {
  videos: Video[];
  loading: boolean;
  loadingMore: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  autoplayIndex: number;
  load: () => void;
  loadMore: () => void;
  refresh: () => void;
  onViewableIndexChange: (index: number) => void;
}

export function useFeed({ query }: UseFeedOptions): UseFeedReturn {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [autoplayIndex, setAutoplayIndex] = useState(-1);

  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);
  const videosRef = useRef<Video[]>([]);    // stable ref for callbacks

  // Keep ref in sync
  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  // ── Prefetch thumbnails ahead of current scroll position ──────────────────
  const prefetchImagesAhead = useCallback((fromIndex: number, allVideos: Video[]) => {
    const end = Math.min(fromIndex + IMAGE_PREFETCH_AHEAD, allVideos.length - 1);
    const urls: string[] = [];
    for (let i = fromIndex; i <= end; i++) {
      urls.push(allVideos[i].thumbnailUrl);
    }
    imageCacheService.prefetchBatch(urls);
  }, []);

  // ── Load first page ───────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchVideos(query, 1);
      pageRef.current = 1;
      setVideos(result.videos);
      setHasMore(result.nextPage);
      setAutoplayIndex(0);
      // Pre-warm image cache immediately
      prefetchImagesAhead(0, result.videos);
      // Pre-warm video buffers
      videoPreloadManager.preloadAhead(
        result.videos.map((v) => ({ id: v.id, youtubeId: v.youtubeId })),
        0
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load videos');
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [query, prefetchImagesAhead]);

  // ── Load next page ─────────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return;
    isFetchingRef.current = true;
    setLoadingMore(true);

    try {
      const nextPage = pageRef.current + 1;
      const result = await fetchVideos(query, nextPage);
      pageRef.current = nextPage;
      setVideos((prev) => {
        const merged = [...prev, ...result.videos];
        // Prefetch thumbnails for newly appended items
        prefetchImagesAhead(prev.length, merged);
        return merged;
      });
      setHasMore(result.nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [query, hasMore, prefetchImagesAhead]);

  // ── Pull-to-refresh ────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setRefreshing(true);

    try {
      const result = await fetchVideos(query, 1);
      pageRef.current = 1;
      setVideos(result.videos);
      setHasMore(result.nextPage);
      setAutoplayIndex(0);
      prefetchImagesAhead(0, result.videos);
      videoPreloadManager.preloadAhead(
        result.videos.map((v) => ({ id: v.id, youtubeId: v.youtubeId })),
        0
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [query, prefetchImagesAhead]);

  // ── Viewability callback ───────────────────────────────────────────────────
  const onViewableIndexChange = useCallback((index: number) => {
    setAutoplayIndex(index);
    const allVideos = videosRef.current;
    if (!allVideos.length) return;

    // Advance image prefetch window
    prefetchImagesAhead(index, allVideos);

    // Advance video preload pool
    videoPreloadManager.preloadAhead(
      allVideos.map((v) => ({ id: v.id, youtubeId: v.youtubeId })),
      index
    );
  }, [prefetchImagesAhead]);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    load();
    return () => {
      videoPreloadManager.releaseAll();
    };
  }, [load]);

  return {
    videos,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore,
    autoplayIndex,
    load,
    loadMore,
    refresh,
    onViewableIndexChange,
  };
}
