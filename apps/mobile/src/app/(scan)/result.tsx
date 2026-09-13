import { classifyDecoded, getOpenableUrl } from '@qrcraft/core';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Copy, RefreshCw } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeIn } from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MinTouchTarget, Radius, ScrollContentBottomInset, Spacing } from '@/constants/theme';
import { useQrContent } from '@/hooks/qr-content-store';
import { useTheme } from '@/hooks/use-theme';
import { useTimedFlag } from '@/hooks/use-timed-flag';
import { addScanHistoryEntry, getScanHistory, type ScanHistoryEntry } from '@/utils/storage';

const TYPE_LABELS: Record<string, string> = {
  url: 'Link',
  wifi: 'Wi-Fi',
  vcard: 'Contact',
  email: 'Email',
  sms: 'SMS',
  tel: 'Phone',
  geo: 'Location',
  vevent: 'Event',
  crypto: 'Crypto',
  text: 'Text',
};

export default function ScanResultScreen() {
  const { value } = useLocalSearchParams<{ value: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { setText, setContentMode } = useQrContent();
  // Snapshot taken before this scan is recorded, so "Recent scans" shows
  // scans *before* the current one rather than duplicating it at the top.
  const [history] = useState<ScanHistoryEntry[]>(() => getScanHistory());
  const [copied, triggerCopied] = useTimedFlag();

  const decoded = value ?? '';
  const contentType = classifyDecoded(decoded);
  const openableUrl = getOpenableUrl(decoded);

  useEffect(() => {
    if (!decoded) return;
    addScanHistoryEntry(decoded);
  }, [decoded]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface }]}
      contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Result' }} />

      <ThemedView type="surfaceRaised" glass style={styles.resultCard}>
        <View style={styles.chips}>
          <View style={[styles.chip, { backgroundColor: theme.surfaceInset }]}>
            <ThemedText type="label" themeColor="textSecondary">
              {TYPE_LABELS[contentType] ?? 'Text'}
            </ThemedText>
          </View>
          {openableUrl ? (
            <View style={[styles.chip, { backgroundColor: theme.warningSurface }]}>
              <ThemedText type="label" themeColor="warning">
                External site
              </ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText type="mono" themeColor="textPrimary" style={styles.value}>
          {decoded}
        </ThemedText>
      </ThemedView>

      {openableUrl ? (
        <PressableScale
          onPress={() => void Linking.openURL(openableUrl)}
          accessibilityRole="button"
          style={[styles.primaryButton, { minHeight: MinTouchTarget, backgroundColor: theme.action }]}>
          <ThemedText type="label" themeColor="actionFg">
            Open link
          </ThemedText>
        </PressableScale>
      ) : null}

      <View style={styles.secondaryRow}>
        <PressableScale
          onPress={() => {
            void Clipboard.setStringAsync(decoded);
            triggerCopied();
          }}
          accessibilityRole="button"
          style={[styles.secondaryButton, { backgroundColor: theme.surfaceRaised }]}>
          <Copy size={18} color={theme.action} />
          <Animated.View key={copied ? 'copied' : 'copy'} entering={FadeIn.duration(150)}>
            <ThemedText type="label" themeColor="action">
              {copied ? 'Copied' : 'Copy'}
            </ThemedText>
          </Animated.View>
        </PressableScale>

        <PressableScale
          onPress={() => {
            // "Recreate" moves the raw decoded value into a fresh text/URL
            // QR — it does not reverse-parse structured payloads (WIFI:,
            // vCard, ...) back into their editable fields; core only
            // builds those strings, it doesn't parse them.
            setContentMode('text');
            setText(decoded);
            router.navigate('/(generate)');
          }}
          accessibilityRole="button"
          style={[styles.secondaryButton, { backgroundColor: theme.surfaceRaised }]}>
          <RefreshCw size={18} color={theme.action} />
          <ThemedText type="label" themeColor="action">
            Recreate
          </ThemedText>
        </PressableScale>
      </View>

      {history.length > 0 ? (
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <ThemedText type="label" themeColor="textSecondary">
              Recent scans
            </ThemedText>
          </View>
          <ThemedView type="surfaceRaised" glass style={styles.historyList}>
            {history.slice(0, 10).map((entry, i) => (
              <View
                key={entry.id}
                style={[
                  styles.historyRow,
                  i < history.length - 1 && { borderBottomWidth: 0.5, borderBottomColor: theme.borderSubtle },
                ]}>
                <ThemedText type="body" numberOfLines={1} style={{ flex: 1 }}>
                  {entry.value}
                </ThemedText>
              </View>
            ))}
          </ThemedView>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: ScrollContentBottomInset,
    gap: Spacing.md,
  },
  resultCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  chip: {
    height: 26,
    paddingHorizontal: Spacing.sm,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    lineHeight: 22,
  },
  primaryButton: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    minHeight: MinTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.full,
  },
  historySection: {
    gap: Spacing.xs,
  },
  historyHeader: {
    paddingHorizontal: 2,
  },
  historyList: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
  },
});
