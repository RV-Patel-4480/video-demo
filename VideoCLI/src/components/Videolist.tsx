/**
 * VideoList.tsx
 *
 * Horizontal (or vertical) paginated list of VideoPlayer items.
 * Only the currently visible item plays — all others are paused automatically.
 *
 * Usage:
 *   const VIDEOS = [
 *     { id: '1', uri: 'https://...' },
 *     { id: '2', uri: 'https://...' },
 *   ]
 *
 *   <VideoList
 *     data={VIDEOS}
 *     horizontal          // default: true
 *     itemWidth={320}
 *     itemHeight={220}
 *   />
 */

import React, { memo, useCallback, useRef, useState } from 'react'
import {
  FlatList,
  FlatListProps,
  StyleSheet,
  View,
  ViewToken,
} from 'react-native'
import VideoPlayer, { VideoPlayerProps } from './VideoPlayer'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VideoListItem {
  /** Unique key for the list item */
  id: string
  /** Video URI */
  uri: string
  /** Optional per-item VideoPlayer overrides */
  videoProps?: Partial<VideoPlayerProps>
}

export interface VideoListProps
  extends Omit<FlatListProps<VideoListItem>, 'data' | 'renderItem'> {
  data: VideoListItem[]

  /** Width of each video card. Defaults to 300. */
  itemWidth?: number

  /** Height of each video card. Defaults to 220. */
  itemHeight?: number

  /** Gap between items. Defaults to 12. */
  itemGap?: number

  /** Render list horizontally. Defaults to true. */
  horizontal?: boolean

  /** Whether this list's parent screen is focused. Pass useIsFocused(). */
  isFocused?: boolean

  /** Extra props forwarded to every VideoPlayer instance. */
  videoProps?: Partial<VideoPlayerProps>
}

// ---------------------------------------------------------------------------
// Viewability config — item must be ≥60% visible to count as "active"
// ---------------------------------------------------------------------------

const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 60,
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const VideoList: React.FC<VideoListProps> = ({
  data,
  itemWidth = 300,
  itemHeight = 220,
  itemGap = 12,
  horizontal = true,
  isFocused,
  videoProps: sharedVideoProps,
  contentContainerStyle,
  ...flatListProps
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(0)

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index)
      }
    },
    [],
  )

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig: VIEWABILITY_CONFIG, onViewableItemsChanged },
  ])

  const renderItem = useCallback(
    ({ item, index }: { item: VideoListItem; index: number }) => (
      <View
        style={[
          styles.itemContainer,
          {
            width: itemWidth,
            height: itemHeight,
            marginRight: horizontal ? itemGap : 0,
            marginBottom: horizontal ? 0 : itemGap,
          },
        ]}
      >
        <VideoPlayer
          source={{ uri: item.uri }}
          width={itemWidth}
          height={itemHeight}
          index={index}
          activeIndex={activeIndex}
          isFocused={isFocused}
          {...sharedVideoProps}
          {...item.videoProps}
        />
      </View>
    ),
    [activeIndex, isFocused, itemWidth, itemHeight, itemGap, horizontal, sharedVideoProps],
  )

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      horizontal={horizontal}
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
      contentContainerStyle={[
        horizontal ? styles.horizontalContent : styles.verticalContent,
        contentContainerStyle,
      ]}
      // Perf tweaks
      removeClippedSubviews
      maxToRenderPerBatch={3}
      windowSize={5}
      initialNumToRender={2}
      {...flatListProps}
    />
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  itemContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  horizontalContent: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  verticalContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
})

export default memo(VideoList)