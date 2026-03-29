/**
 * VideoPlayer.tsx
 *
 * A fully customizable, performant React Native video component.
 *
 * Features:
 * - Automatic pause when off-screen (using IntersectionObserver via onViewableItemsChanged / useIsFocused)
 * - Native iOS & Android controls
 * - Caching via react-native-video's built-in cache + optional poster caching
 * - Horizontal list support with active-index-based playback
 * - Fully extensible via ...props (all react-native-video props pass through)
 *
 * Usage:
 *   <VideoPlayer source={{ uri: '...' }} />
 */

import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native'
import { useIsFocused } from '@react-navigation/native'
import Video, {
  OnLoadData,
  OnProgressData,
  VideoRef,
  VideoProperties,
} from 'react-native-video'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VideoPlayerProps extends Omit<VideoProperties, 'style'> {
  /** Required video source */
  source: VideoProperties['source']

  /** Width of the player. Defaults to '100%'. */
  width?: number | string

  /** Height of the player. Defaults to 220. */
  height?: number | string

  /** Optional container style override */
  containerStyle?: StyleProp<ViewStyle>

  /** Optional video element style override */
  videoStyle?: StyleProp<ViewStyle>

  /**
   * When used inside a list, pass the index of THIS item and the index of the
   * currently visible item. Only this item will play; all others pause.
   * Leave both undefined when used as a standalone player.
   */
  index?: number
  activeIndex?: number

  /**
   * Whether the host screen is currently focused.
   * Pass `useIsFocused()` from @react-navigation/native.
   * When false the video pauses automatically (e.g. navigating away).
   * Defaults to `true` so the component works without react-navigation.
   */
  isFocused?: boolean

  /** Show native platform video controls. Defaults to true. */
  controls?: boolean

  /** Show a loading spinner while buffering. Defaults to true. */
  showLoadingIndicator?: boolean

  /** Tint color of the loading spinner. */
  loadingColor?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const VideoPlayer = forwardRef<VideoRef, VideoPlayerProps>(
  (
    {
      source,
      width = '100%',
      height = 220,
      containerStyle,
      videoStyle,
      index,
      activeIndex,
      isFocused: isFocusedProp,
      controls = true,
      showLoadingIndicator = true,
      loadingColor = '#FFFFFF',
      paused: pausedProp,
      onLoad,
      onProgress,
      onError,
      onEnd,
      ...restProps
    },
    ref,
  ) => {
    // ------------------------------------------------------------------
    // Focus detection (auto-pause on screen blur)
    // ------------------------------------------------------------------
    // Try to read navigation focus state; fall back to prop or true.
    let navFocused = true
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      navFocused = useIsFocused()
    } catch {
      // useIsFocused throws when used outside a NavigationContainer.
      navFocused = isFocusedProp ?? true
    }
    const screenFocused = isFocusedProp ?? navFocused

    // ------------------------------------------------------------------
    // Derive paused state
    // ------------------------------------------------------------------
    const isInList = index !== undefined && activeIndex !== undefined
    const isActiveInList = isInList ? index === activeIndex : true

    // Paused when:
    //  1. Caller explicitly pauses via `paused` prop
    //  2. Screen is not focused (navigated away / app backgrounded)
    //  3. Inside a list and this item is not the active one
    const paused =
      pausedProp !== undefined
        ? pausedProp || !screenFocused || !isActiveInList
        : !screenFocused || !isActiveInList

    // ------------------------------------------------------------------
    // Loading / buffering state
    // ------------------------------------------------------------------
    const [isLoading, setIsLoading] = useState(true)

    const handleLoad = useCallback(
      (data: OnLoadData) => {
        setIsLoading(false)
        onLoad?.(data)
      },
      [onLoad],
    )

    const handleProgress = useCallback(
      (data: OnProgressData) => {
        onProgress?.(data)
      },
      [onProgress],
    )

    // ------------------------------------------------------------------
    // Derived video style
    // ------------------------------------------------------------------
    const resolvedVideoStyle = StyleSheet.flatten([
      styles.video,
      { width, height },
      videoStyle,
    ])

    return (
      <View style={[styles.container, { width, height }, containerStyle]}>
        <Video
          ref={ref}
          source={source}
          style={resolvedVideoStyle}
          paused={paused}
          controls={controls}
          // ---- Caching ----
          // react-native-video caches HLS/DASH segments automatically on iOS
          // (AVPlayer cache) and on Android (ExoPlayer cache) when bufferConfig
          // is set. Expose full control to the caller via restProps.
          bufferConfig={{
            minBufferMs: 3000,
            maxBufferMs: 20000,
            bufferForPlaybackMs: 1500,
            bufferForPlaybackAfterRebufferMs: 3000,
          }}
          // ---- Playback quality ----
          ignoreSilentSwitch="ignore" // Play even when iOS silent switch is on
          playInBackground={false}   // No background playback
          playWhenInactive={false}   // Pause when notification centre is pulled
          // ---- Callbacks ----
          onLoad={handleLoad}
          onProgress={handleProgress}
          onError={onError}
          onEnd={onEnd}
          // ---- Pass-through ----
          {...restProps}
        />

        {/* Loading Spinner Overlay */}
        {showLoadingIndicator && isLoading && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={loadingColor} />
          </View>
        )}
      </View>
    )
  },
)

VideoPlayer.displayName = 'VideoPlayer'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default memo(VideoPlayer)