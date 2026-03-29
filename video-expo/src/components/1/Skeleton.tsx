import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { COLORS, THUMB_H, THUMB_W, CARD_INFO_H } from '../../constants';

const W = Dimensions.get('window').width;

interface ShimmerProps {
  w: number | string;
  h: number;
  radius?: number;
  delay?: number;
  anim: Animated.Value;
}

const Shimmer: React.FC<ShimmerProps> = ({ w, h, radius = 6, delay = 0, anim }) => {
  const opacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.35, 0.7, 0.35],
  });

  return (
    <Animated.View
      style={{
        width: w as number,
        height: h,
        borderRadius: radius,
        backgroundColor: COLORS.skeletonShimmer,
        opacity,
      }}
    />
  );
};

export const VideoCardSkeleton: React.FC<{ delay?: number }> = ({ delay = 0 }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
        delay,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={styles.card}>
      {/* Thumbnail */}
      <View style={{ width: THUMB_W, height: THUMB_H, backgroundColor: COLORS.skeleton }} />
      {/* Info row */}
      <View style={styles.info}>
        <Shimmer w={36} h={36} radius={18} anim={anim} />
        <View style={styles.lines}>
          <Shimmer w={W * 0.72} h={13} anim={anim} />
          <View style={{ height: 7 }} />
          <Shimmer w={W * 0.48} h={11} anim={anim} />
        </View>
      </View>
    </View>
  );
};

export const FeedSkeleton: React.FC = () => (
  <>
    {[0, 160, 320, 480, 640].map((delay, i) => (
      <VideoCardSkeleton key={i} delay={delay} />
    ))}
  </>
);

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    backgroundColor: COLORS.bg,
  },
  info: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    alignItems: 'flex-start',
    height: CARD_INFO_H,
  },
  lines: { flex: 1, paddingTop: 2 },
});
