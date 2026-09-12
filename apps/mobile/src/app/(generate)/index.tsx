import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Palette } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';

import { ContentTypePills } from '@/components/content-type-pills';
import { PressableScale } from '@/components/pressable-scale';
import { QrPreview } from '@/components/qr-preview';
import { ReliabilitySelector } from '@/components/reliability-selector';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MinTouchTarget, Radius, ScrollContentBottomInset, Spacing } from '@/constants/theme';
import { useQrContent } from '@/hooks/qr-content-store';
import { useTheme } from '@/hooks/use-theme';

const QR_PREVIEW_SIZE = 220;

export default function GenerateScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    text,
    setText,
    liveValue,
    ecLevel,
    setEcLevel,
    fgColor,
    bgColor,
    design,
    inputError,
    isUsable,
    isPending,
    capacityUsed,
    capacityMax,
    isNearCapacity,
    isOverCapacity,
  } = useQrContent();

  const shareDisabled = !isUsable;

  // Both animate a state the interface confirms after the fact (find-
  // animation-opportunities review), not per-keystroke data — the 150ms
  // duration and FadeIn/FadeOut match the convention already used by Pill,
  // SegmentedControl, SwatchRow, and QrPreview's crossfade. Shared by Save
  // to Photos and Share below — both gate on the same isUsable condition.
  const shareOpacity = useSharedValue(shareDisabled ? 0.5 : 1);
  useEffect(() => {
    shareOpacity.value = withTiming(shareDisabled ? 0.5 : 1, { duration: 150 });
  }, [shareDisabled, shareOpacity]);
  const shareAnimatedStyle = useAnimatedStyle(() => ({ opacity: shareOpacity.value }));

  const qrCaptureRef = useRef<View>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSaveToPhotos = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // Write-only request: this app only ever adds a photo, never reads
      // the library, so it asks for the narrower NSPhotoLibraryAddUsageDescription
      // permission rather than full read/write access.
      const permission = await requestPermissionsAsync(true);
      if (!permission.granted) {
        Alert.alert(
          'Photo library access needed',
          'Allow QRCraft to save photos in Settings to save your QR code.',
        );
        return;
      }
      const uri = await captureRef(qrCaptureRef, { format: 'png', quality: 1 });
      await Asset.create(uri);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 1500);
    } catch {
      Alert.alert('Couldn’t save', 'Something went wrong saving your QR code. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // ScrollView is the screen's own root (not wrapped in another View) —
    // react-native-screens' native-stack header (headerLargeTitle) only
    // integrates its content-inset/collapse behavior correctly with a
    // direct-child scroll view. Wrapping it in a container View left the
    // first screenful of content hidden behind the expanded large title.
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets>
      <ContentTypePills />

      <ThemedView type="surfaceRaised" glass style={styles.inputCard}>
        <ThemedText type="label" themeColor="textSecondary">
          Link
        </ThemedText>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Paste or type a URL"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={[styles.input, { color: theme.textPrimary }]}
        />
        <ThemedText
          type="mono"
          themeColor={isOverCapacity ? 'error' : isNearCapacity ? 'warning' : 'textSecondary'}
          style={styles.capacityCounter}
          accessibilityLabel={`${capacityUsed} of ${capacityMax} characters used`}>
          {capacityUsed}/{capacityMax}
        </ThemedText>
        {inputError ? (
          <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(120)}>
            <ThemedText type="body" themeColor="error">
              {inputError}
            </ThemedText>
          </Animated.View>
        ) : null}
      </ThemedView>

      <ThemedView type="surfaceRaised" glass style={styles.previewCard}>
        {/* collapsable={false}: without it Android can optimize this plain
            wrapper out of the native tree, and react-native-view-shot has
            nothing to capture. */}
        <View ref={qrCaptureRef} collapsable={false}>
          <QrPreview
            value={liveValue}
            ecLevel={ecLevel}
            fgColor={fgColor}
            bgColor={bgColor}
            design={design}
            size={QR_PREVIEW_SIZE}
            isPending={isPending}
          />
        </View>
        <ReliabilitySelector value={ecLevel} onChange={setEcLevel} />
      </ThemedView>

      <PressableScale
        onPress={() => {
          void handleSaveToPhotos();
        }}
        disabled={shareDisabled || isSaving}
        accessibilityRole="button"
        accessibilityState={{ disabled: shareDisabled || isSaving, busy: isSaving }}
        style={[styles.primaryButton, { minHeight: MinTouchTarget, backgroundColor: theme.action }, shareAnimatedStyle]}>
        {isSaving ? (
          <ActivityIndicator color={theme.actionFg} />
        ) : (
          <ThemedText type="label" themeColor="actionFg">
            Save to Photos
          </ThemedText>
        )}
      </PressableScale>
      {savedFeedback ? (
        <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)}>
          <ThemedText type="body" themeColor="textSecondary" style={styles.savedFeedback}>
            Saved to Photos
          </ThemedText>
        </Animated.View>
      ) : null}

      <ThemedView style={styles.secondaryRow}>
        <PressableScale
          disabled={shareDisabled}
          onPress={() => {
            void Share.share({ message: liveValue });
          }}
          accessibilityRole="button"
          accessibilityState={{ disabled: shareDisabled }}
          style={[styles.secondaryButton, { backgroundColor: theme.surfaceRaised }, shareAnimatedStyle]}>
          <ThemedText type="label" themeColor="action">
            Share
          </ThemedText>
        </PressableScale>

        <PressableScale
          onPress={() => router.push('/(generate)/design')}
          accessibilityRole="button"
          style={[styles.secondaryButton, { backgroundColor: theme.surfaceRaised }]}>
          <SymbolView
            name={{ ios: 'paintpalette' }}
            size={18}
            tintColor={theme.action}
            fallback={<Palette size={18} color={theme.action} />}
          />
          <ThemedText type="label" themeColor="action">
            Design
          </ThemedText>
        </PressableScale>
      </ThemedView>
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
  inputCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs / 2,
  },
  input: {
    fontSize: 17,
    paddingVertical: Spacing.xs / 2,
    minHeight: MinTouchTarget,
  },
  capacityCounter: {
    alignSelf: 'flex-end',
  },
  previewCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.md,
  },
  primaryButton: {
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MinTouchTarget,
  },
  savedFeedback: {
    textAlign: 'center',
    marginTop: -Spacing.xs,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: 'transparent',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.full,
    minHeight: MinTouchTarget,
  },
});
