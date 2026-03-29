import { useIsFocused } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import VideoPlayer from '../components/VideoPlayer';

const CHAT_VIDEO_URI = 'https://www.w3schools.com/html/mov_bbb.mp4';

export default function Custom() {
    console.log(1);

  const isFocused = useIsFocused();
  return (
    <View style={styles.screen}>
      {/* ── 3. Customised standalone player ───────────────────────────── */}
      <Text style={styles.label}>3 · Custom Options via ...props</Text>
      <VideoPlayer
        source={{ uri: CHAT_VIDEO_URI }}
        height={200}
        isFocused={isFocused}
        controls
        muted // start muted
        repeat // loop
        resizeMode="cover"
        loadingColor="#FF6B35"
        containerStyle={styles.customVideo}
        onLoad={data => console.log('Loaded', data.duration, 's')}
        onError={e => console.error('Video error', e)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0F0F0F', gap: 1 },
  label: {
    color: '#AAA',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
  },
  customVideo: {
    borderRadius: 16,
  },
});
