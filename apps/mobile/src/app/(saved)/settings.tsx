import Constants from 'expo-constants';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Appearance, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { PressableScale } from '@/components/pressable-scale';
import { SegmentedControl } from '@/components/segmented-control';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { clearScanHistory, getSavedCodes, getSettings, setSettings, type AppSettings } from '@/utils/storage';

const MAX_SAVED_CODES = 10;

export default function SettingsScreen() {
  const theme = useTheme();
  const [settings, setSettingsState] = useState<AppSettings>(() => getSettings());
  const [savedCount, setSavedCount] = useState(0);
  const [historyCleared, setHistoryCleared] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setSavedCount(getSavedCodes().length);
    }, []),
  );

  const applyThemeOverride = (themeOverride: AppSettings['themeOverride']) => {
    Appearance.setColorScheme(themeOverride === 'system' ? 'unspecified' : themeOverride);
    setSettingsState(setSettings({ themeOverride }));
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.surface }]} contentContainerStyle={styles.content}>
      <Section label="Appearance">
        <ThemedView type="surfaceRaised" glass style={[styles.group, styles.row]}>
          <ThemedText type="body">Theme</ThemedText>
          <SegmentedControl
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            value={settings.themeOverride}
            onChange={applyThemeOverride}
          />
        </ThemedView>
      </Section>

      <Section label="Defaults">
        <ThemedView type="surfaceRaised" glass style={styles.group}>
          <SettingsRow label="Saved designs" value={`${savedCount} of ${MAX_SAVED_CODES}`} />
          <PressableScale
            onPress={() => {
              clearScanHistory();
              setHistoryCleared(true);
              setTimeout(() => setHistoryCleared(false), 1500);
            }}
            accessibilityRole="button"
            style={styles.settingsRow}>
            <ThemedText type="body" themeColor="error">
              Clear scan history
            </ThemedText>
            {historyCleared ? (
              <Animated.View entering={FadeIn.duration(150)}>
                <ThemedText type="body" themeColor="textSecondary">
                  Cleared
                </ThemedText>
              </Animated.View>
            ) : null}
          </PressableScale>
        </ThemedView>
      </Section>

      <Section label="About">
        <ThemedView type="surfaceRaised" glass style={styles.group}>
          <SettingsRow label="Version" value={Constants.expoConfig?.version ?? '1.0.0'} last />
        </ThemedView>
        <ThemedText type="body" themeColor="textSecondary" style={styles.footnote}>
          Everything happens on this device. Nothing you enter is uploaded.
        </ThemedText>
      </Section>
    </ScrollView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: Spacing.xs }}>
      <ThemedText type="label" themeColor="textSecondary" style={{ paddingHorizontal: 4 }}>
        {label}
      </ThemedText>
      {children}
    </View>
  );
}

function SettingsRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.settingsRow, !last && { borderBottomWidth: 0.5, borderBottomColor: theme.borderSubtle }]}>
      <ThemedText type="body">{label}</ThemedText>
      <ThemedText type="body" themeColor="textSecondary">
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  group: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  row: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: Spacing.md,
  },
  footnote: {
    paddingHorizontal: 4,
    lineHeight: 18,
  },
});
