import { ActivityIndicator, FlatList, ListRenderItemInfo, Pressable, RefreshControl, StatusBar, StyleSheet, Text, View, ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryTabs, Header } from '@/components/1/HeaderAndTabs';
import { FeedSkeleton } from '@/components/1/Skeleton';
import VideoCard from '@/components/1/VideoCard';
import VideoDetailSheet from '@/components/1/VideoDetailSheet';
import { CARD_TOTAL_H, COLORS, END_REACHED_THRESHOLD, INITIAL_NUM_TO_RENDER, MAX_TO_RENDER_PER_BATCH, UPDATE_CELLS_BATCHING_PERIOD, VIEWABILITY_CONFIG, WINDOW_SIZE } from '@/constants';
import { useFeed } from '@/hooks/useFeed';
import { Video } from '@/services/api';
import { useCallback, useMemo, useRef, useState } from 'react';

export default function HomeScreen() {
   const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('javascript');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const {
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
  } = useFeed({ query });

  // ── Viewability callback pair (MUST be a ref, not inline) ─────────────────
  const viewabilityConfigCallbackPairs = useRef([
    {
      viewabilityConfig: VIEWABILITY_CONFIG,
      onViewableItemsChanged: ({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0) {
          const first = viewableItems[0];
          if (typeof first.index === 'number') {
            onViewableIndexChange(first.index);
          }
        }
      },
    },
  ]);

  // ── renderItem — stable callback, VideoCard memo handles re-render gating ──
  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Video>) => (
      <VideoCard
        video={item}
        index={index}
        isActive={index === autoplayIndex}
        onPress={(v) => {
          setSelectedVideo(v);
          setSheetVisible(true);
        }}
      />
    ),
    [autoplayIndex]
  );

  // ── getItemLayout — O(1) scroll position calculation ─────────────────────
  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: CARD_TOTAL_H,
      offset: CARD_TOTAL_H * index,
      index,
    }),
    []
  );

  const keyExtractor = useCallback((item: Video) => item.id, []);

  const handleEndReached = useCallback(() => {
    if (!loadingMore && hasMore) loadMore();
  }, [loadMore, loadingMore, hasMore]);

  const handleQueryChange = useCallback((q: string) => {
    setQuery(q);
  }, []);

  // ── Footer ────────────────────────────────────────────────────────────────
  const ListFooter = useMemo(() => {
    if (loadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={COLORS.red} />
        </View>
      );
    }
    if (!hasMore && videos.length > 0) {
      return (
        <View style={styles.footer}>
          <Text style={styles.endText}>You're all caught up ✓</Text>
        </View>
      );
    }
    return <View style={styles.footerSpacer} />;
  }, [loadingMore, hasMore, videos.length]);

  // ── Error state ───────────────────────────────────────────────────────────
  if (error && videos.length === 0) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <Header onSearch={handleQueryChange} query={query} />
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>📡</Text>
          <Text style={styles.errorTitle}>Connection error</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <Header onSearch={handleQueryChange} query={query} />
      <CategoryTabs onSelect={handleQueryChange} />

      {/* ── Feed ──────────────────────────────────────────────────────────── */}
      {loading && videos.length === 0 ? (
        <View style={styles.skeletonScroll}>
          <FeedSkeleton />
        </View>
      ) : (
        <FlatList
          data={videos}
          renderItem={renderItem}
          keyExtractor={keyExtractor}

          // ── Layout ────────────────────────────────────────────────────────
          getItemLayout={getItemLayout}

          // ── Performance ───────────────────────────────────────────────────
          removeClippedSubviews               // unmount off-screen native views
          initialNumToRender={INITIAL_NUM_TO_RENDER}
          windowSize={WINDOW_SIZE}
          maxToRenderPerBatch={MAX_TO_RENDER_PER_BATCH}
          updateCellsBatchingPeriod={UPDATE_CELLS_BATCHING_PERIOD}

          // ── Autoplay ──────────────────────────────────────────────────────
          viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}

          // ── Pagination ────────────────────────────────────────────────────
          onEndReached={handleEndReached}
          onEndReachedThreshold={END_REACHED_THRESHOLD}
          ListFooterComponent={() => ListFooter}

          // ── Pull to refresh ───────────────────────────────────────────────
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={COLORS.red}
              colors={[COLORS.red]}
              progressBackgroundColor={COLORS.surface}
            />
          }

          showsVerticalScrollIndicator={false}
          bounces
          overScrollMode="never"           // Android: no glow effect
          decelerationRate="normal"

          // ── Accessibility ─────────────────────────────────────────────────
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        />
      )}

      {/* ── Detail sheet ──────────────────────────────────────────────────── */}
      <VideoDetailSheet
        video={selectedVideo}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
 root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  skeletonScroll: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerSpacer: { height: 8 },
  endText: {
    color: COLORS.textMuted,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  errorEmoji: { fontSize: 52, marginBottom: 8 },
  errorTitle: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
  errorMsg: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: COLORS.red,
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 22,
  },
  retryText: { color: COLORS.white, fontSize: 14, fontWeight: '800' }, 
});
