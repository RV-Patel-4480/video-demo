/**
 * Example.tsx — Usage examples for VideoPlayer & VideoList
 *
 * Install deps:
 *   npm install react-native-video @react-navigation/native
 *   # iOS
 *   cd ios && pod install
 */

import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useIsFocused } from '@react-navigation/native'
import VideoPlayer from '../components/VideoPlayer'
import Videolist, { VideoListItem } from '../components/Videolist'

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const CHAT_VIDEO_URI = 'https://www.w3schools.com/html/mov_bbb.mp4'

const HORIZONTAL_VIDEOS: VideoListItem[] = [
  { id: '1', uri: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { id: '2', uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
  { id: '3', uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
]

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function HorizontalList() {
  /**
   * useIsFocused() → true when this screen is on top of the nav stack.
   * Pass it down so videos pause when you navigate away.
   */
  const isFocused = useIsFocused()

  return (
    <View style={styles.screen} >

      
      {/* ── 2. Horizontal video list ──────────────────────────────────── */}
      <Text style={styles.label}>2 · Horizontal Video List</Text>
      <Videolist
        data={HORIZONTAL_VIDEOS}
        itemWidth={300}
        itemHeight={180}
        itemGap={12}
        horizontal
        isFocused={isFocused}
        videoProps={{
          controls: true,
          resizeMode: 'cover',
        }}
      />

     

    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F0F0F', gap: 4 },
  label: {
    color: '#AAA',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
  },
})