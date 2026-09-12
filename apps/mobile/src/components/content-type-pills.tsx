import type { QRContentMode } from '@qrcraft/core';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, interpolateColor } from 'react-native-reanimated';

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
  const { contentMode, setContentMode } = useQrContent();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.row}>
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
  // A horizontal ScrollView nested in a vertical one collapses to zero
  // height without an explicit height on the scroller itself —
  // contentContainerStyle alone isn't enough to size it.
  scrollView: {
    height: MinTouchTarget,
    flexGrow: 0,
  },
  row: {
    gap: Spacing.xs / 2,
    paddingRight: Spacing.md,
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
