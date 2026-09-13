import type { QRContentMode } from '@qrcraft/core';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';

import { ContentFields } from '@/components/content-fields';
import { ContentTypeGrid } from '@/components/content-type-grid';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { CONTENT_TYPE_META } from '@/constants/content-types';
import { MinTouchTarget, Spacing } from '@/constants/theme';
import { useQrContent } from '@/hooks/qr-content-store';
import { useTheme } from '@/hooks/use-theme';

type Step = 'type' | 'fields';

// Presented as a modal (see (generate)/_layout.tsx), same fixed full-height
// treatment as design.tsx. Two steps live inside that one fixed container —
// choose a content type (the /prototype "Grouped" grid), then that type's
// fields — so the sheet never resizes when moving between them: both step
// panels are absolutely positioned over the same flex:1 area, and only the
// panel's contents cross-fade/slide, not the container itself.
export default function ContentScreen() {
  const router = useRouter();
  const theme = useTheme();
  const store = useQrContent();
  const [step, setStep] = useState<Step>(store.rawValue.trim() ? 'fields' : 'type');

  const meta = CONTENT_TYPE_META[store.contentMode];

  const selectType = (mode: QRContentMode) => {
    store.setContentMode(mode);
    setStep('fields');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceRaised }]}>
      <View style={styles.header}>
        {step === 'fields' ? (
          <PressableScale
            onPress={() => setStep('type')}
            accessibilityRole="button"
            accessibilityLabel="Change content type"
            style={styles.backButton}>
            <ChevronLeft size={22} color={theme.action} />
            <ThemedText type="label" themeColor="action">
              Type
            </ThemedText>
          </PressableScale>
        ) : (
          <View style={styles.headerSpacer} />
        )}

        <ThemedText type="body" themeColor="textPrimary" style={styles.title}>
          {step === 'type' ? 'Choose content type' : meta.label}
        </ThemedText>

        {step === 'fields' ? (
          <PressableScale onPress={() => router.back()} accessibilityRole="button" style={styles.headerSpacer}>
            <ThemedText type="label" themeColor="action">
              Done
            </ThemedText>
          </PressableScale>
        ) : (
          <PressableScale onPress={() => router.back()} accessibilityRole="button" style={styles.headerSpacer}>
            <ThemedText type="label" themeColor="action">
              Cancel
            </ThemedText>
          </PressableScale>
        )}
      </View>

      <View style={styles.steps}>
        {step === 'type' ? (
          <Animated.View
            key="type"
            entering={SlideInLeft.duration(220)}
            exiting={SlideOutLeft.duration(220)}
            style={styles.stepPanel}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <ContentTypeGrid onSelect={selectType} />
            </ScrollView>
          </Animated.View>
        ) : (
          <Animated.View
            key="fields"
            entering={SlideInRight.duration(220)}
            exiting={SlideOutRight.duration(220)}
            style={styles.stepPanel}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <ContentFields mode={store.contentMode} store={store} />
              {store.inputError ? (
                <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(120)}>
                  <ThemedText type="body" themeColor="error">
                    {store.inputError}
                  </ThemedText>
                </Animated.View>
              ) : null}
              <View style={styles.counterRow}>
                <ThemedText type="mono" themeColor={store.isOverCapacity ? 'error' : 'textSecondary'}>
                  {store.capacityUsed}/{store.capacityMax}
                </ThemedText>
              </View>
            </ScrollView>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MinTouchTarget,
  },
  title: {
    fontWeight: '600',
  },
  headerSpacer: {
    minWidth: 60,
    minHeight: MinTouchTarget,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  // The shared, fixed-size stage both step panels render into — its size
  // never changes when `step` changes, only which absolutely-positioned
  // panel is on top.
  steps: {
    flex: 1,
    position: 'relative',
  },
  stepPanel: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});
