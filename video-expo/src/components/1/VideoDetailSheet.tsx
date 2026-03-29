import React, { useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video } from '../../services/api';
import { parseDuration, compactNumber, timeAgo, avatarColor } from '../../utils/formatters';
import { COLORS, SCREEN } from '../../constants';

const { height: H, width: W } = Dimensions.get('window');
const SHEET_H = H * 0.91;
const THUMB_H = Math.round(W * 9 / 16);

interface VideoDetailProps {
  video: Video | null;
  visible: boolean;
  onClose: () => void;
}

const ActionPill: React.FC<{ icon: string; label: string }> = memo(({ icon, label }) => (
  <Pressable
    style={action.pill}
    android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
  >
    <Text style={action.icon}>{icon}</Text>
    <Text style={action.label}>{label}</Text>
  </Pressable>
));

const StatCard: React.FC<{ value: string; label: string }> = memo(({ value, label }) => (
  <View style={stat.card}>
    <Text style={stat.value}>{value}</Text>
    <Text style={stat.label}>{label}</Text>
  </View>
));

const action = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    gap: 6,
  },
  icon: { fontSize: 15 },
  label: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
});

const stat = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  value: { color: COLORS.white, fontSize: 20, fontWeight: '800' },
  label: { color: COLORS.textMuted, fontSize: 11, marginTop: 2, fontWeight: '500' },
});

const VideoDetailSheet: React.FC<VideoDetailProps> = ({ video, visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(H)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        tension: 72,
        friction: 12,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: H,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const close = useCallback(() => {
    Animated.timing(translateY, {
      toValue: H,
      duration: 260,
      useNativeDriver: true,
    }).start(onClose);
  }, [onClose]);

  if (!video) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={sheet.overlay}>
        <TouchableOpacity style={sheet.backdrop} activeOpacity={1} onPress={close} />
        <Animated.View
          style={[
            sheet.container,
            { height: SHEET_H, paddingBottom: insets.bottom + 8 },
            { transform: [{ translateY }] },
          ]}
        >
          {/* Handle bar */}
          <View style={sheet.handle} />

          {/* Thumbnail */}
          <View style={{ height: THUMB_H, backgroundColor: '#000' }}>
            <Image
              source={video.thumbnailUrl}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            {/* Gradient overlay */}
            <View style={sheet.thumbGradient} />
          </View>

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {/* Title block */}
            <View style={sheet.section}>
              <Text style={sheet.title}>{video.title}</Text>
              <View style={sheet.titleMeta}>
                <Text style={sheet.metaText}>
                  {compactNumber(video.viewCount)} views
                </Text>
                <Text style={sheet.dot}>·</Text>
                <Text style={sheet.metaText}>{timeAgo(video.publishedAt)}</Text>
                {video.tags[0] && (
                  <>
                    <Text style={sheet.dot}>·</Text>
                    <Text style={sheet.tag}>#{video.tags[0]}</Text>
                  </>
                )}
              </View>
            </View>

            {/* Action pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={sheet.actions}
            >
              <ActionPill icon="👍" label={compactNumber(video.likeCount)} />
              <ActionPill icon="👎" label="Dislike" />
              <ActionPill icon="↗️" label="Share" />
              <ActionPill icon="⬇️" label="Download" />
              <ActionPill icon="📋" label="Save" />
              <ActionPill icon="✂️" label="Clip" />
            </ScrollView>

            {/* Channel row */}
            <View style={sheet.channelRow}>
              <View style={[sheet.chAvatar, { backgroundColor: avatarColor(video.channelId) }]}>
                <Text style={sheet.chInitial}>
                  {video.channelTitle[0]?.toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={sheet.chName}>{video.channelTitle}</Text>
              </View>
              <Pressable style={sheet.subBtn}>
                <Text style={sheet.subBtnText}>Subscribe</Text>
              </Pressable>
            </View>

            {/* Description */}
            <Pressable style={sheet.descBox}>
              <View style={sheet.descChips}>
                {video.isHD && <View style={sheet.descChip}><Text style={sheet.descChipText}>HD</Text></View>}
                <View style={sheet.descChip}><Text style={sheet.descChipText}>{parseDuration(video.durationRaw)}</Text></View>
              </View>
              <Text style={sheet.descText} numberOfLines={4}>
                {video.description || 'No description available.'}
              </Text>
              <Text style={sheet.showMore}>Show more</Text>
            </Pressable>

            {/* Stats */}
            <View style={sheet.statsRow}>
              <StatCard value={compactNumber(video.viewCount)} label="Views" />
              <StatCard value={compactNumber(video.likeCount)} label="Likes" />
              <StatCard value={compactNumber(video.commentCount)} label="Comments" />
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default memo(VideoDetailSheet);

const sheet = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.65)' },
  container: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#444',
    alignSelf: 'center',
    marginVertical: 10,
  },
  thumbGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'transparent',
  },
  section: { paddingHorizontal: 14, paddingVertical: 12 },
  title: { color: COLORS.white, fontSize: 15.5, fontWeight: '700', lineHeight: 22 },
  titleMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 5, gap: 4 },
  metaText: { color: COLORS.textSecondary, fontSize: 12.5 },
  dot: { color: COLORS.textMuted, fontSize: 11 },
  tag: { color: '#3EA6FF', fontSize: 12.5, fontWeight: '500' },
  actions: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  chAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  chInitial: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  chName: { color: COLORS.white, fontSize: 14, fontWeight: '600' },
  subBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  subBtnText: { color: COLORS.bg, fontSize: 13, fontWeight: '800' },
  descBox: {
    margin: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 13,
    padding: 13,
  },
  descChips: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  descChip: {
    backgroundColor: COLORS.surfaceElevated,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  descChipText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  descText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 19 },
  showMore: { color: COLORS.white, fontSize: 13, fontWeight: '700', marginTop: 6 },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
});
