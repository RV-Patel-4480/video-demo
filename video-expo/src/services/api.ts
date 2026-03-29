import { API_BASE, PAGE_LIMIT } from '@/constants';

// ─── Raw API Types ───────────────────────────────────────────────────────────

interface RawThumbnail {
  url: string;
  width: number;
  height: number;
}

interface RawVideo {
  kind: string;
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: RawThumbnail;
      medium: RawThumbnail;
      high: RawThumbnail;
      standard?: RawThumbnail;
      maxres?: RawThumbnail;
    };
    channelTitle: string;
    tags?: string[];
    categoryId: string;
    liveBroadcastContent: 'none' | 'live' | 'upcoming';
    localized: { title: string; description: string };
    defaultAudioLanguage?: string;
  };
  contentDetails: {
    duration: string;        // ISO 8601 e.g. PT19M35S
    dimension: '2d' | '3d';
    definition: 'hd' | 'sd';
    caption: 'true' | 'false';
    licensedContent: boolean;
    contentRating: Record<string, unknown>;
    projection: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    favoriteCount: string;
    commentCount: string;
  };
}

interface RawApiResponse {
  statusCode: number;
  data: {
    page: number;
    limit: number;
    totalPages: number;
    previousPage: boolean;
    nextPage: boolean;
    totalItems: number;
    currentPageItems: number;
    data: Array<{ kind: string; items: RawVideo }>;
  };
  message: string;
  success: boolean;
}

// ─── Normalized App Type ─────────────────────────────────────────────────────

export interface Video {
  id: string;               // unique key for FlatList / pools
  youtubeId: string;        // YouTube video ID
  title: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;      // ISO string
  description: string;
  tags: string[];
  thumbnailUrl: string;     // pre-selected best quality
  durationRaw: string;      // ISO 8601 duration
  isHD: boolean;
  isLive: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface FetchResult {
  videos: Video[];
  nextPage: boolean;
  totalPages: number;
  page: number;
}

// ─── Normalizer ──────────────────────────────────────────────────────────────

function normalizeVideo(raw: RawVideo): Video {
  const { snippet, contentDetails, statistics } = raw;
  const t = snippet.thumbnails;

  return {
    id: raw.id,
    youtubeId: raw.id,
    title: snippet.title,
    channelTitle: snippet.channelTitle,
    channelId: snippet.channelId,
    publishedAt: snippet.publishedAt,
    description: snippet.description,
    tags: snippet.tags ?? [],
    thumbnailUrl:
      t.maxres?.url ?? t.standard?.url ?? t.high?.url ?? t.medium.url,
    durationRaw: contentDetails.duration,
    isHD: contentDetails.definition === 'hd',
    isLive: snippet.liveBroadcastContent === 'live',
    viewCount: parseInt(statistics.viewCount, 10) || 0,
    likeCount: parseInt(statistics.likeCount, 10) || 0,
    commentCount: parseInt(statistics.commentCount, 10) || 0,
  };
}

// ─── Simple request-dedup cache ───────────────────────────────────────────────

const responseCache = new Map<string, FetchResult>();

export async function fetchVideos(
  query: string,
  page: number
): Promise<FetchResult> {
  const cacheKey = `${query}::${page}`;
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey)!;
  }

  const url =
    `${API_BASE}?page=${page}&limit=${PAGE_LIMIT}` +
    `&query=${encodeURIComponent(query)}&sortBy=mostViewed`;

  const response = await fetch(url, {
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Network error ${response.status}`);
  }

  const json: RawApiResponse = await response.json();

  if (!json.success) {
    throw new Error(json.message ?? 'API error');
  }

  const result: FetchResult = {
    videos: json.data.data.map((entry) => normalizeVideo(entry.items)),
    nextPage: json.data.nextPage,
    totalPages: json.data.totalPages,
    page: json.data.page,
  };

  // Cache successful responses to avoid re-fetching on tab switch / refresh
  responseCache.set(cacheKey, result);
  return result;
}

export function clearApiCache(): void {
  responseCache.clear();
}
