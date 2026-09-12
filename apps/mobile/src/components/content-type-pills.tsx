import type { QRContentMode } from '@qrcraft/core';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ChevronRight } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useQrContent } from '@/hooks/qr-content-store';

const CONTENT_TYPES: { mode: QRContentMode; label: string }[] = [
  { mode: 'text', label: 'Link' },
  { mode: 'wifi', label: 'Wi-Fi' },
  { mode: 'vcard', label: 'Contact' },
  { mode: 'email', label: 'Email' },
  { mode: 'sms', label: 'SMS' },
  { mode: 'tel', label: 'Phone' },
  { mode: 'geo', label: 'Location' },
  { mode: 'vevent', label: 'Event' },
  { mode: 'crypto', label: 'Crypto' },
];

// "Link" (text/URL) stays on the Generate screen; every other content type
// pushes the shared structured-form screen (build sequence step 5).
export function ContentTypePills() {
  const router = useRouter();
  const theme = useTheme();
  const { contentMode, setContentMode } = useQrContent();

  // Row height is measured, not fixed — a fixed height clips pill labels
  // at large Dynamic Type sizes (an /impeccable audit finding); it starts
  // at MinTouchTarget so the row is never zero-height before the first
  // onContentSizeChange (a horizontal ScrollView nested in a vertical one
  // otherwise collapses without an explicit height).
  const [rowHeight, setRowHeight] = useState(MinTouchTarget);
  // Trailing chevron while more pills sit off-screen — 4 of 9 content
  // types had no discoverability cue beyond an accidentally truncated
  // glyph at the edge (same audit).
  const [hasMoreToScroll, setHasMoreToScroll] = useState(false);
  const viewportWidth = useRef(0);
  const contentWidth = useRef(0);

  const updateScrollAffordance = (offsetX: number) => {
    setHasMoreToScroll(contentWidth.current - (offsetX + viewportWidth.current) > 4);
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.scrollView, { height: rowHeight }]}
        contentContainerStyle={styles.row}
        onLayout={(e: LayoutChangeEvent) => {
          viewportWidth.current = e.nativeEvent.layout.width;
          updateScrollAffordance(0);
        }}
        onContentSizeChange={(width, height) => {
          contentWidth.current = width;
          setRowHeight(Math.max(MinTouchTarget, height));
          updateScrollAffordance(0);
        }}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => updateScrollAffordance(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={32}>
        {CONTENT_TYPES.map(({ mode, label }) => (
          <Pill
            key={mode}
            label={label}
            active={mode === contentMode}
            onPress={() => {
              setContentMode(mode);
              if (mode !== 'text') {
                router.push({ pathname: '/(generate)/form', params: { type: mode } });
              }
            }}
          />
        ))}
      </ScrollView>
      {hasMoreToScroll ? (
        <Animated.View
          pointerEvents="none"
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          style={styles.scrollHint}>
          <SymbolView
            name={{ ios: 'chevron.right' }}
            size={14}
            tintColor={theme.textSecondary}
            fallback={<ChevronRight size={14} color={theme.textSecondary} />}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  const progress = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: 150 });
  }, [active, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [theme.surfaceRaised, theme.action]),
  }));

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.pill, { minHeight: MinTouchTarget }]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.pillBg, animatedStyle]} />
      <ThemedText type="label" themeColor={active ? 'actionFg' : 'textPrimary'}>
        {label}
      </ThemedText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  // Bleeds to the screen edges instead of sitting in the parent
  // ScrollView's Spacing.md content padding like every other row on the
  // screen — a horizontally scrollable chip strip reads as scrollable
  // when it isn't boxed in the same inset as the static cards below it.
  // The row's own paddingLeft/Right restores the same visual start
  // position, just inside the scrollable content instead of fixed.
  wrapper: {
    position: 'relative',
    marginHorizontal: -Spacing.md,
  },
  scrollView: {
    flexGrow: 0,
  },
  row: {
    gap: Spacing.xs / 2,
    paddingHorizontal: Spacing.md,
  },
  scrollHint: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBg: {
    borderRadius: Radius.full,
  },
});
