import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform, View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  type?: ThemeColor;
  /**
   * Render as real iOS 26 Liquid Glass (expo-glass-effect's GlassView)
   * instead of a flat fill, matching every card/pill/header surface in
   * docs/specs/qrcraft-mobile-design's iOS mockups. Falls back to the
   * normal solid `type` fill everywhere else (Android, iOS < 26, or when
   * accessibility settings disable the effect) — per the platform
   * contract's own rule: never fake glass with plain opacity.
   */
  glass?: boolean;
};

export function ThemedView({ style, type, glass, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();
  const canUseGlass = glass && Platform.OS === 'ios' && isLiquidGlassAvailable();

  if (canUseGlass) {
    return <GlassView glassEffectStyle="regular" style={style} {...otherProps} />;
  }

  return <View style={[{ backgroundColor: theme[type ?? 'surface'] }, style]} {...otherProps} />;
}
