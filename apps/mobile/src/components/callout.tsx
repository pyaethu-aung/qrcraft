import { AlertTriangle } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Shared warning banner (Wi-Fi's "password stays on this device", Design's
// low-reliability-pattern warning) — was duplicated identically between
// design.tsx and content-fields.tsx.
export function Callout({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.callout, { backgroundColor: theme.warningSurface, borderColor: theme.warningBorder }]}>
      <AlertTriangle size={18} color={theme.warning} />
      <ThemedText type="body" themeColor="warning" style={styles.text}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  callout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.sm,
  },
  text: {
    flex: 1,
  },
});
