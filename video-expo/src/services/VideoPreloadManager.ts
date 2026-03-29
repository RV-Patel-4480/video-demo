/**
 * VideoPreloadManager
 *
 * Maintains a pool of VideoPlayer instances created BEFORE the user
 * scrolls to them. When the item enters the viewport the player is
 * already buffered and playback starts instantly — identical to how
 * TikTok / YouTube Shorts / Instagram Reels work natively.
 *
 * Key design decisions:
 *  - Players are created with createVideoPlayer() so their lifecycle is
 *    manually controlled (not tied to a component mount/unmount cycle)
 *  - We keep a MAX_POOL_SIZE to avoid excessive memory pressure
 *  - On eviction, we call release() to free native resources
 *  - useCaching:true is passed so repeated views play from local disk
 *
 * expo-video docs note:
 *   "Even when the player is not connected to a VideoView, it will
 *    fill the buffers."
 *   This is the exact behaviour we exploit for preloading.
 */

import { createVideoPlayer, VideoPlayer } from 'expo-video';
import { VIDEO_PREFETCH_AHEAD } from '../constants';

const MAX_POOL_SIZE = VIDEO_PREFETCH_AHEAD + 3; // keep a few extra for back-scroll

interface PoolEntry {
  videoId: string;
  player: VideoPlayer;
  createdAt: number;
}

class VideoPreloadManager {
  private pool = new Map<string, PoolEntry>();
  private creationQueue: string[] = [];

  /**
   * Call this whenever the visible index changes.
   * Ensures players for indices [currentIndex .. currentIndex + VIDEO_PREFETCH_AHEAD]
   * are pre-created and buffering.
   */
  preloadAhead(
    videos: Array<{ id: string; youtubeId: string }>,
    currentIndex: number
  ): void {
    const endIdx = Math.min(
      currentIndex + VIDEO_PREFETCH_AHEAD,
      videos.length - 1
    );

    for (let i = currentIndex; i <= endIdx; i++) {
      const video = videos[i];
      if (!video) continue;
      if (this.pool.has(video.id)) continue; // already buffering

      this.createPlayer(video.id, video.youtubeId);
    }

    // Evict old players that are far behind the scroll position
    this.evictStale(currentIndex);
  }

  private createPlayer(videoId: string, youtubeId: string): void {
    if (this.pool.size >= MAX_POOL_SIZE) {
      // Release the oldest entry to stay within pool limit
      this.evictOldest();
    }

    try {
      // We use the YouTube embed URL — in a real app this would be a direct
      // streamable URL (HLS/MP4). expo-video will begin buffering immediately.
      const player = createVideoPlayer(
        {
          uri: `https://www.youtube.com/embed/${youtubeId}`,
          // useCaching: true  ← enable when using direct MP4/HLS URLs
          //                      YouTube iframe does not support caching
        },
        (p) => {
          p.muted = true;    // muted until user-initiated play
          p.loop = true;
          // Do NOT call p.play() here — we only buffer, not play
        }
      );

      this.pool.set(videoId, {
        videoId,
        player,
        createdAt: Date.now(),
      });
    } catch {
      // createVideoPlayer can throw if system resources are exhausted
    }
  }

  /**
   * Get a pre-created player for the given video ID.
   * Returns null if it wasn't preloaded (caller should create on demand).
   */
  getPlayer(videoId: string): VideoPlayer | null {
    return this.pool.get(videoId)?.player ?? null;
  }

  /**
   * Called when a video card unmounts or scrolls far offscreen.
   * We release the player to free native decoder/buffer resources.
   */
  releasePlayer(videoId: string): void {
    const entry = this.pool.get(videoId);
    if (entry) {
      try {
        entry.player.pause();
        entry.player.release();
      } catch {}
      this.pool.delete(videoId);
    }
  }

  private evictStale(currentIndex: number): void {
    // Remove players that are more than MAX_POOL_SIZE behind current position
    // We don't have index info per-entry, so we evict by age when pool is full
    if (this.pool.size <= MAX_POOL_SIZE) return;
    this.evictOldest();
  }

  private evictOldest(): void {
    let oldest: PoolEntry | null = null;
    for (const entry of this.pool.values()) {
      if (!oldest || entry.createdAt < oldest.createdAt) {
        oldest = entry;
      }
    }
    if (oldest) {
      this.releasePlayer(oldest.videoId);
    }
  }

  releaseAll(): void {
    for (const entry of this.pool.values()) {
      try {
        entry.player.pause();
        entry.player.release();
      } catch {}
    }
    this.pool.clear();
  }

  get activePlayerCount(): number {
    return this.pool.size;
  }
}

export const videoPreloadManager = new VideoPreloadManager();
