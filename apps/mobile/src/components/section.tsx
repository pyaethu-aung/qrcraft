import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

// Shared labeled group wrapper (Design's "Eye border"/"Pixel pattern"
// sections, Settings' "Appearance"/"Defaults"/"About" sections) — was
// duplicated identically apart from one inline label style.
export function Section({
  label,
  labelStyle,
  children,
}: {
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  children: ReactNode;
}) {
  return (
    <View style={styles.container}>
      <ThemedText type="label" themeColor="textSecondary" style={labelStyle}>
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
});
