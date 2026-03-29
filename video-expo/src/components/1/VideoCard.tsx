/**
 * VideoCard
 *
 * Performance contract:
 *  - Wrapped in React.memo with custom areEqual comparator
 *  - Only re-renders when: id changes, OR isActive (autoplay) changes
 *  - Thumbnail rendered by expo-image with cachePolicy="memory-disk"
 *  - When isActive=true: shows inline VideoView connected to pre-warmed player
 *  - When isActive=false: shows static thumbnail (zero GPU cost)
 *  - Player lifecycle is owned by VideoPreloadManager, not this component
 */

import React, { useCallback, useEffect, useRef, useState, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableNativeFeedback,
  Pressable,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Video } from '../../services/api';
import { COLORS, THUMB_W, THUMB_H, AVATAR_SIZE, CARD_INFO_H, IS_IOS } from '../../constants';
import { parseDuration, compactNumber, timeAgo, avatarColor } from '../../utils/formatters';

// ─── Sub-components (all memoized) ──────────────────────────────────────────

const Avatar = memo(({ channelTitle, channelId }: { channelTitle: string; channelId: string }) => {
  const bg = avatarColor(channelId);
  const initials = channelTitle
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();

  return (
    <View style={[styles.avatar, { backgroundColor: bg }]}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
});

const DurationBadge = memo(({ duration }: { duration: string }) => (
  <View style={styles.durationBadge}>
    <Text style={styles.durationText}>{duration}</Text>
  </View>
));

const LiveBadge = memo(() => (
  <View style={styles.liveBadge}>
    <View style={styles.liveDot} />
    <Text style={styles.liveText}>LIVE</Text>
  </View>
));

// ─── Inline video player (only mounted when this card is active) ──────────

const InlinePlayer: React.FC<{ video: Video; onMuteToggle: () => void; muted: boolean }> = ({
  video,
  onMuteToggle,
  muted,
}) => {
  const player = useVideoPlayer(
    {
      uri: `https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`,
      // useCaching: true — enable for direct MP4/HLS sources
    },
    (p) => {
      p.muted = muted;
      p.loop = true;
      p.play();
    }
  );

  useEffect(() => {
    player.muted = muted;
  }, [muted]);

  return (
    <View style={styles.playerWrapper}>
      <VideoView
        player={player}
        style={styles.videoView}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
      />
      {/* Mute toggle */}
      <Pressable style={styles.muteBtn} onPress={onMuteToggle}>
        <View style={styles.muteBtnInner}>
          <Text style={styles.muteIcon}>{muted ? '🔇' : '🔊'}</Text>
        </View>
      </Pressable>
    </View>
  );
};

// ─── Main VideoCard ──────────────────────────────────────────────────────────

interface VideoCardProps {
  video: Video;
  isActive: boolean;       // true = this card is the autoplay target
  onPress: (video: Video) => void;
  index: number;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, isActive, onPress, index }) => {
  const [muted, setMuted] = useState(true);
  const duration = parseDuration(video.durationRaw);

  const handlePress = useCallback(() => onPress(video), [video, onPress]);
  const handleMuteToggle = useCallback(() => setMuted((m) => !m), []);

  // Reset mute to true when card leaves autoplay
  useEffect(() => {
    if (!isActive) setMuted(true);
  }, [isActive]);

  const Touchable = IS_IOS ? TouchableOpacity : TouchableNativeFeedback;
  const touchableProps = IS_IOS
    ? { activeOpacity: 0.96, onPress: handlePress }
    : {
        onPress: handlePress,
        background: TouchableNativeFeedback.Ripple('rgba(255,255,255,0.06)', false),
        useForeground: true,
      };

  return (
    // @ts-ignore — cross-platform touchable
    <Touchable {...touchableProps}>
      <View style={styles.card}>
        {/* ── Thumbnail / Player ─────────────────────────────────────────── */}
        <View style={styles.mediaContainer}>
          {/* Thumbnail is ALWAYS rendered — acts as poster frame */}
          <Image
            source={video.thumbnailUrl}
            style={styles.thumbnail}
            contentFit="cover"
            cachePolicy="memory-disk"      // L1: memory, L2: disk
            priority={index < 4 ? 'high' : 'normal'}
            recyclingKey={video.id}        // prevents flash on list recycle
            transition={{ duration: 180, effect: 'cross-dissolve' }}
          />

          {/* Active: overlay the VideoView on top of thumbnail */}
          {isActive && (
            <View style={StyleSheet.absoluteFill}>
              <InlinePlayer
                video={video}
                muted={muted}
                onMuteToggle={handleMuteToggle}
              />
            </View>
          )}

          {/* Duration / Live badge */}
          {video.isLive ? (
            <LiveBadge />
          ) : (
            <DurationBadge duration={duration} />
          )}

          {/* HD chip */}
          {video.isHD && !video.isLive && (
            <View style={styles.hdBadge}>
              <Text style={styles.hdText}>HD</Text>
            </View>
          )}
        </View>

        {/* ── Info Row ───────────────────────────────────────────────────── */}
        <View style={styles.infoRow}>
          <Avatar channelTitle={video.channelTitle} channelId={video.channelId} />

          <View style={styles.metaBlock}>
            <Text style={styles.title} numberOfLines={2}>
              {video.title}
            </Text>
            <View style={styles.subRow}>
              <Text style={styles.channelName} numberOfLines={1}>
                {video.channelTitle}
              </Text>
              <Text style={styles.separator}>·</Text>
              <Text style={styles.meta}>
                {compactNumber(video.viewCount)} views
              </Text>
              <Text style={styles.separator}>·</Text>
              <Text style={styles.meta}>{timeAgo(video.publishedAt)}</Text>
            </View>
          </View>

          {/* Kebab menu */}
          <Pressable
            style={styles.kebab}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            android_ripple={{ color: 'rgba(255,255,255,0.1)', radius: 18 }}
          >
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.kebabDot} />
            ))}
          </Pressable>
        </View>
      </View>
    </Touchable>
  );
};

// ─── Custom memo comparator — only re-render when critical props change ──────
export default memo(VideoCard, (prev, next) => {
  return prev.video.id === next.video.id && prev.isActive === next.isActive;
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    width: THUMB_W,
    backgroundColor: COLORS.bg,
    marginBottom: 8,
  },
  mediaContainer: {
    width: THUMB_W,
    height: THUMB_H,
    backgroundColor: '#0a0a0a',
    overflow: 'hidden',
  },
  thumbnail: {
    ...StyleSheet.absoluteFillObject,
  },
  playerWrapper: {
    flex: 1,
  },
  videoView: {
    flex: 1,
  },
  muteBtn: {
    position: 'absolute',
    bottom: 44,
    right: 10,
  },
  muteBtnInner: {
    backgroundColor: COLORS.durationBg,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteIcon: { fontSize: 14 },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: COLORS.durationBg,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  durationText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    fontVariant: ['tabular-nums'],
  },
  liveBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.liveRed,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  liveText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hdBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  hdText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    height: CARD_INFO_H,
    gap: 10,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metaBlock: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: 0.05,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 3,
  },
  channelName: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    fontWeight: '500',
    flexShrink: 1,
  },
  separator: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  meta: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
  },
  kebab: {
    paddingTop: 4,
    paddingLeft: 4,
    gap: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 40,
  },
  kebabDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
  },
});
