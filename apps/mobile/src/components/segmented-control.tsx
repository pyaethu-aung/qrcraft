import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { MinTouchTarget, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

// Generic segmented control (Scan reliability, Wi-Fi security, Crypto
// network, Design fill type, the Basics/Advanced design tabs) — extracted
// after the reliability selector's own "shrinks to content width inside a
// centered parent" bug (see build sequence step 4 notes) so every caller
// gets `alignSelf: 'stretch'` and `numberOfLines={1}` for free instead of
// re-fixing it per instance.
//
// Reads as a real tab bar: a single pill slides and resizes to the
// selected segment (measured via onLayout, animated as transform +
// width — sanctioned because the pill is absolutely positioned with no
// children, so nothing else re-lays-out) rather than each segment fading
// its own background in and out. The pill fills with `theme.action`
// (terracotta), matching DESIGN.md's Terracotta Economy rule, which names
// "the active state of a segmented control" as one of the accent's three
// sanctioned uses — a flat neutral fill measured under 2:1 contrast
// against its own track (impeccable critique, 2026-09-12).
export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  const [layouts, setLayouts] = useState<Partial<Record<T, { x: number; width: number }>>>({});
  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);
  const measured = useRef(false);

  useEffect(() => {
    const layout = layouts[value];
    if (!layout) return;

    if (!measured.current) {
      // First measurement: snap into place, don't slide in from (0, 0).
      indicatorX.set(layout.x);
      indicatorW.set(layout.width);
      measured.current = true;
      return;
    }

    indicatorX.set(withTiming(layout.x, { duration: 250, easing: EASE_IN_OUT, reduceMotion: ReduceMotion.System }));
    indicatorW.set(withTiming(layout.width, { duration: 250, easing: EASE_IN_OUT, reduceMotion: ReduceMotion.System }));
  }, [value, layouts, indicatorX, indicatorW]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.get() }],
    width: indicatorW.get(),
  }));

  return (
    <View style={[styles.track, { backgroundColor: theme.surfaceInset }, style]}>
      <Animated.View
        pointerEvents="none"
        style={[styles.indicator, { backgroundColor: theme.action }, indicatorStyle]}
      />
      {options.map((option) => (
        <Segment
          key={option.value}
          label={option.label}
          selected={option.value === value}
          onPress={() => {
            if (option.value === value) return;
            void Haptics.selectionAsync();
            onChange(option.value);
          }}
          onLayout={({ nativeEvent }: LayoutChangeEvent) => {
            const { x, width } = nativeEvent.layout;
            setLayouts((prev) => {
              const existing = prev[option.value];
              if (existing && existing.x === x && existing.width === width) return prev;
              return { ...prev, [option.value]: { x, width } };
            });
          }}
        />
      ))}
    </View>
  );
}

function Segment({
  label,
  selected,
  onPress,
  onLayout,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  return (
    <PressableScale
      onPress={onPress}
      onLayout={onLayout}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.segment, { minHeight: MinTouchTarget }]}>
      <ThemedText type="label" numberOfLines={1} themeColor={selected ? 'actionFg' : 'textSecondary'}>
        {label}
      </ThemedText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  track: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    padding: 2,
    borderRadius: Radius.lg,
    gap: 2,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  indicator: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: 0,
    borderRadius: Radius.md,
  },
});
