import React, { useState, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
  TouchableNativeFeedback,
  Platform,
} from 'react-native';
import { COLORS, IS_IOS } from '../../constants';

// ─── YouTube Logo ─────────────────────────────────────────────────────────────

const YTLogo = memo(() => (
  <View style={logo.container}>
    <View style={logo.pill}>
      <View style={logo.playIcon} />
    </View>
    <Text style={logo.wordmark}>YouTube</Text>
  </View>
));

const logo = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pill: {
    width: 30,
    height: 21,
    backgroundColor: COLORS.red,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    width: 0,
    height: 0,
    borderTopWidth: 5.5,
    borderBottomWidth: 5.5,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: COLORS.white,
    marginLeft: 2,
  },
  wordmark: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
});

// ─── Header ──────────────────────────────────────────────────────────────────

interface HeaderProps {
  onSearch: (q: string) => void;
  query: string;
}

export const Header: React.FC<HeaderProps> = memo(({ onSearch, query }) => {
  const [searchMode, setSearchMode] = useState(false);
  const [text, setText] = useState(query);
  const inputRef = useRef<TextInput>(null);

  if (searchMode) {
    return (
      <View style={header.searchBar}>
        <TouchableOpacity
          onPress={() => { setSearchMode(false); setText(query); }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={header.backArrow}>←</Text>
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={header.input}
          value={text}
          onChangeText={setText}
          placeholder="Search YouTube"
          placeholderTextColor={COLORS.textMuted}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={() => {
            const q = text.trim();
            if (q) { onSearch(q); setSearchMode(false); }
          }}
          selectionColor={COLORS.red}
          clearButtonMode="while-editing"
        />

        {text.length > 0 && Platform.OS === 'android' && (
          <Pressable onPress={() => setText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={header.clearBtn}>✕</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={header.bar}>
      <YTLogo />
      <View style={header.actions}>
        {/* Cast icon */}
        <Pressable
          style={header.iconBtn}
          android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 20, borderless: true }}
        >
          <Text style={header.icon}>📡</Text>
        </Pressable>
        {/* Notifications */}
        <Pressable
          style={header.iconBtn}
          android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 20, borderless: true }}
        >
          <Text style={header.icon}>🔔</Text>
        </Pressable>
        {/* Search */}
        <Pressable
          style={header.iconBtn}
          onPress={() => setSearchMode(true)}
          android_ripple={{ color: 'rgba(255,255,255,0.15)', radius: 20, borderless: true }}
        >
          <Text style={header.icon}>🔍</Text>
        </Pressable>
        {/* Avatar */}
        <Pressable style={header.avatar}>
          <Text style={header.avatarText}>Y</Text>
        </Pressable>
      </View>
    </View>
  );
});

const header = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: COLORS.bg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  backArrow: { color: COLORS.white, fontSize: 22, fontWeight: '300' },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearBtn: { color: COLORS.textMuted, fontSize: 14 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconBtn: { padding: 7 },
  icon: { fontSize: 19 },
  avatar: {
    width: 29,
    height: 29,
    borderRadius: 14.5,
    backgroundColor: '#3B5998',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },
  avatarText: { color: COLORS.white, fontSize: 12, fontWeight: '800' },
});

// ─── Category Chips ──────────────────────────────────────────────────────────

const CATEGORIES = [
  { label: 'All', query: 'javascript' },
  { label: 'Gaming', query: 'gaming' },
  { label: 'Music', query: 'music' },
  { label: 'News', query: 'news' },
  { label: 'Sports', query: 'sports' },
  { label: 'Technology', query: 'technology' },
  { label: 'Cooking', query: 'cooking' },
  { label: 'Travel', query: 'travel' },
  { label: 'Education', query: 'education' },
  { label: 'Fitness', query: 'fitness' },
];

interface CategoryTabsProps {
  onSelect: (query: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = memo(({ onSelect }) => {
  const [active, setActive] = useState('All');

  return (
    <View style={chips.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={chips.row}
        bounces={false}
        decelerationRate="fast"
      >
        {CATEGORIES.map(({ label, query }) => {
          const isActive = active === label;
          return (
            <Pressable
              key={label}
              onPress={() => { setActive(label); onSelect(query); }}
              style={[chips.chip, isActive && chips.chipActive]}
              android_ripple={{ color: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)', borderless: false }}
            >
              <Text style={[chips.label, isActive && chips.labelActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

const chips = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  row: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceElevated,
  },
  chipActive: {
    backgroundColor: COLORS.white,
  },
  label: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  labelActive: {
    color: COLORS.bg,
    fontWeight: '700',
  },
});
