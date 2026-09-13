import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Palette, Pencil } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { captureRef } from 'react-native-view-shot';

import { PressableScale } from '@/components/pressable-scale';
import { QrPreview } from '@/components/qr-preview';
import { ReliabilitySelector } from '@/components/reliability-selector';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CONTENT_TYPE_META } from '@/constants/content-types';
import { MinTouchTarget, Radius, ScrollContentBottomInset, Spacing } from '@/constants/theme';
import { useQrContent, type QrContentStore } from '@/hooks/qr-content-store';
import { useTheme } from '@/hooks/use-theme';
import { useTimedFlag } from '@/hooks/use-timed-flag';

const QR_PREVIEW_SIZE = 220;

// null when there's nothing to summarize yet — the QR placeholder's own
// "Tap to generate" already carries that message, so the caption below it
// would only repeat it (per review feedback, "Add content" / "Tap to
// choose a content type" isn't required).
function contentSummary(store: QrContentStore): { title: string; caption: string } | null {
  if (!store.rawValue.trim()) {
    return null;
  }

  const title = CONTENT_TYPE_META[store.contentMode].label;
  switch (store.contentMode) {
    case 'text':
      return { title, caption: store.text };
    case 'wifi':
      return { title, caption: store.wifi.ssid || 'Network' };
    case 'vcard':
      return { title, caption: `${store.vcard.firstName} ${store.vcard.lastName}`.trim() || 'Contact card' };
    case 'email':
      return { title, caption: store.email.to || 'Email draft' };
    case 'sms':
      return { title, caption: store.sms.number || 'Text message' };
    case 'tel':
      return { title, caption: store.tel.number || 'Phone number' };
    case 'geo':
      return {
        title,
        caption: store.geo.latitude && store.geo.longitude ? `${store.geo.latitude}, ${store.geo.longitude}` : 'Map location',
      };
    case 'vevent':
      return { title, caption: store.vevent.summary || 'Calendar event' };
    case 'crypto':
      return { title, caption: store.crypto.address || 'Crypto address' };
  }
}

export default function GenerateScreen() {
  const theme = useTheme();
  const router = useRouter();
  const store = useQrContent();
  const { liveValue, ecLevel, setEcLevel, fgColor, bgColor, design, isUsable, isPending } = store;

  const shareDisabled = !isUsable;
  const summary = contentSummary(store);

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
  const [savedFeedback, triggerSavedFeedback] = useTimedFlag();

  const handleSaveToPhotos = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // Write-only request: this app only ever adds a photo, never reads
      // the library, so it asks for the narrower NSPhotoLibraryAddUsageDescription
      // permission rather than full read/write access. Requested before
      // capturing (not in parallel): capturing costs a real render/encode,
      // and on the common first-save/denied path that work would be
      // thrown away, not saved by running it alongside the prompt.
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
      triggerSavedFeedback();
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
      <ThemedView type="surfaceRaised" glass style={styles.previewCard}>
        {/* The QR preview is the single entry point for content: tapping it
            opens the two-step content sheet (choose type -> edit fields)
            instead of the pills row + inline Link field this screen used
            to show side by side (emil-design-eng / impeccable review,
            "Link's input is on Generate screen, but other inputs are in a
            separate screen"). */}
        <PressableScale
          onPress={() => router.push('/(generate)/content')}
          accessibilityRole="button"
          accessibilityLabel={summary ? `Edit ${summary.title.toLowerCase()} content` : 'Add content'}
          style={styles.previewTap}>
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
          <View style={[styles.editBadge, { backgroundColor: theme.action }]}>
            <SymbolView name={{ ios: 'pencil' }} size={14} tintColor={theme.actionFg} fallback={<Pencil size={14} color={theme.actionFg} />} />
          </View>
        </PressableScale>

        {summary ? (
          <View style={styles.captionBlock}>
            <ThemedText type="label" themeColor="textPrimary">
              {summary.title}
            </ThemedText>
            <ThemedText type="body" themeColor="textSecondary" numberOfLines={1} style={styles.captionValue}>
              {summary.caption}
            </ThemedText>
          </View>
        ) : null}

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
  previewCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.md,
  },
  previewTap: {
    position: 'relative',
  },
  editBadge: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionBlock: {
    alignItems: 'center',
    gap: Spacing.xs / 4,
  },
  captionValue: {
    maxWidth: 260,
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
