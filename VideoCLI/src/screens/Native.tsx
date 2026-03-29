import { ScrollView, StyleSheet, Text, View } from "react-native"
import VideoPlayer from "../components/VideoPlayer"
import { useIsFocused } from "@react-navigation/native"

const CHAT_VIDEO_URI = 'https://www.w3schools.com/html/mov_bbb.mp4'

export default function Native() {
    const isFocused = useIsFocused()
     return (
        <View style={styles.screen} >
    
          {/* ── 1. Chat-screen video ──────────────────────────────────────── */}
          <Text style={styles.label}>1 · Chat Screen Video</Text>
          <VideoPlayer
            source={{ uri: CHAT_VIDEO_URI }}
            height={220}
            isFocused={isFocused}
            controls                    // native iOS / Android player UI
            resizeMode="contain"
            containerStyle={styles.chatVideo}
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
      chatVideo: {
        borderRadius: 12,
      },
    })