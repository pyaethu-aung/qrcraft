import { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface SwatchRowProps<T> {
  items: T[];
  selected: T;
  onSelect: (item: T) => void;
  renderIcon: (item: T, selected: boolean) => React.ReactNode;
  keyOf: (item: T) => string;
}

// Shared horizontal row of tappable icon swatches (eye frame/center shape,
// pixel pattern) — matches the design mockups' shape pickers.
export function SwatchRow<T>({ items, selected, onSelect, renderIcon, keyOf }: SwatchRowProps<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView} contentContainerStyle={styles.row}>
      {items.map((item) => {
        const isSelected = keyOf(item) === keyOf(selected);
        return (
          <Swatch key={keyOf(item)} selected={isSelected} onPress={() => onSelect(item)}>
            {renderIcon(item, isSelected)}
          </Swatch>
        );
      })}
    </ScrollView>
  );
}

function Swatch({
  selected,
  onPress,
  children,
}: {
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: 150 });
  }, [selected, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(progress.value, [0, 1], [theme.borderSubtle, theme.action]),
  }));

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.swatch, { backgroundColor: theme.surfaceRaised }]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.swatchBorder, animatedStyle]} />
      {children}
    </PressableScale>
  );
}

const SWATCH_SIZE = 58;

const styles = StyleSheet.create({
  scrollView: {
    height: SWATCH_SIZE,
    flexGrow: 0,
  },
  row: {
    gap: 9,
  },
  swatch: {
    width: SWATCH_SIZE,
    height: SWATCH_SIZE,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchBorder: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
});
