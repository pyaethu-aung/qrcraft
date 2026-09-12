import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// DESIGN.md typography scale, ported 1:1 (fontSize/fontWeight/lineHeight).
export type ThemedTextProps = TextProps & {
  type?: 'display' | 'title' | 'body' | 'label' | 'caption' | 'mono';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'body', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[{ color: theme[themeColor ?? 'textPrimary'] }, styles[type], style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  display: {
    fontSize: 36,
    fontWeight: '700',
    lineHeight: 36 * 1.2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 24 * 1.3,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 16 * 1.5,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 13 * 1.4,
  },
  caption: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 3, // 0.3em @ 10px
    textTransform: 'uppercase',
  },
  mono: {
    fontFamily: Fonts?.mono,
    fontSize: 14,
    fontWeight: '500',
  },
});
