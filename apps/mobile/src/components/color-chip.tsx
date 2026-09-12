import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { PRESET_COLORS } from '@/constants/qrDefaults';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ColorChipProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

// Tap-to-select swatch chip (Foreground/Background/eye colors). RN has no
// native color-input equivalent to web's <input type="color">; picking
// from the brand's preset palette (constants/qrDefaults.ts) is the scoped-
// down alternative for now — see PRESET_COLORS' own comment.
export function ColorChip({ label, value, onChange }: ColorChipProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  return (
    <ThemedView type="surfaceRaised" glass style={styles.container}>
      <PressableScale
        onPress={() => setExpanded((e) => !e)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        style={styles.row}>
        <View style={[styles.swatch, { backgroundColor: value, borderColor: theme.borderSubtle }]} />
        <View style={{ minWidth: 0 }}>
          <ThemedText type="label" themeColor="textSecondary">
            {label}
          </ThemedText>
          <ThemedText type="mono" themeColor="textPrimary" style={{ textTransform: 'uppercase' }}>
            {value}
          </ThemedText>
        </View>
      </PressableScale>
      {expanded ? (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(120)} style={styles.palette}>
          {PRESET_COLORS.map((color) => (
            <PressableScale
              key={color}
              onPress={() => {
                onChange(color);
                setExpanded(false);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Choose ${color}`}
              style={[
                styles.paletteSwatch,
                { backgroundColor: color, borderColor: color === value ? theme.action : theme.borderSubtle },
              ]}
            />
          ))}
        </Animated.View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 0.5,
  },
  palette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  paletteSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
  },
});
