import { Dimensions, Platform } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

export const SCREEN = { W, H };

// Card dimensions - locked values avoid dynamic layout recalculation
export const THUMB_W = W;
export const THUMB_H = Math.round(W * (9 / 16));
export const AVATAR_SIZE = 38;
export const CARD_INFO_H = 76;
export const CARD_TOTAL_H = THUMB_H + CARD_INFO_H; // getItemLayout value

// Feed config
export const INITIAL_NUM_TO_RENDER = 3;
export const WINDOW_SIZE = 5;          // visible items * 2 + 1
export const MAX_TO_RENDER_PER_BATCH = 4;
export const UPDATE_CELLS_BATCHING_PERIOD = 60;
export const END_REACHED_THRESHOLD = 1.2; // start loading 1.2 screens before end

// Prefetch config — how many items ahead to prefetch images & videos
export const IMAGE_PREFETCH_AHEAD = 6;  // prefetch thumbnails N items ahead
export const VIDEO_PREFETCH_AHEAD = 2;  // preload video players N items ahead

// Autoplay: item must be >= this % visible to start playing
export const AUTOPLAY_VISIBILITY_THRESHOLD = 0.75;

// Viewability config for autoplay detection
export const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 75,
  minimumViewTime: 300, // ms the item must be visible before triggering
};

export const API_BASE = 'https://api.freeapi.app/api/v1/public/youtube/videos';
export const PAGE_LIMIT = 10;

export const COLORS = {
  bg: '#0F0F0F',
  surface: '#181818',
  surfaceElevated: '#212121',
  border: '#272727',
  red: '#FF0000',
  redDim: 'rgba(255,0,0,0.12)',
  white: '#FFFFFF',
  text: '#F1F1F1',
  textSecondary: '#AAAAAA',
  textMuted: '#717171',
  skeleton: '#1E1E1E',
  skeletonShimmer: '#2A2A2A',
  overlay: 'rgba(0,0,0,0.82)',
  durationBg: 'rgba(0,0,0,0.88)',
  liveRed: '#FF4444',
};

export const IS_IOS = Platform.OS === 'ios';
export const IS_ANDROID = Platform.OS === 'android';

// Avatar palette — deterministic from channelId char code
export const AVATAR_COLORS = [
  '#C0392B', '#E67E22', '#27AE60', '#2980B9',
  '#8E44AD', '#16A085', '#D35400', '#1ABC9C',
  '#2C3E50', '#E74C3C',
];
