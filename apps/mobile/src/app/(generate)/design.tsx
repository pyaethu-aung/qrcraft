import type { QREyeCenterShape, QREyeFrameShape, QRGradientDirection, QRPixelPattern } from '@qrcraft/core';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Callout } from '@/components/callout';
import { ColorChip } from '@/components/color-chip';
import { PressableScale } from '@/components/pressable-scale';
import { EyeCenterIcon, EyeFrameIcon, PixelPatternIcon } from '@/components/design-swatch-icons';
import { SegmentedControl } from '@/components/segmented-control';
import { SwatchRow } from '@/components/swatch-row';
import { ThemedText } from '@/components/themed-text';
import { DEFAULT_QR_BG_COLOR, DEFAULT_QR_DESIGN_CONFIG, DEFAULT_QR_FG_COLOR } from '@/constants/qrDefaults';
import { Radius, Spacing } from '@/constants/theme';
import { useQrContent } from '@/hooks/qr-content-store';
import { useTheme } from '@/hooks/use-theme';

const EYE_FRAME_SHAPES: QREyeFrameShape[] = ['Square', 'SquareRound', 'Circle', 'Leaf'];
const EYE_CENTER_SHAPES: QREyeCenterShape[] = ['Square', 'Rounded', 'Dot', 'Diamond', 'Star'];
const PIXEL_PATTERNS: QRPixelPattern[] = ['Square', 'Dots', 'Rounded', 'Diamond'];
const GRADIENT_DIRECTIONS: QRGradientDirection[] = [
  'to-t', 'to-tr', 'to-r', 'to-br', 'to-b', 'to-bl', 'to-l', 'to-tl',
];
const DIRECTION_LABELS: Record<QRGradientDirection, string> = {
  'to-t': 'Top',
  'to-tr': 'Top-right',
  'to-r': 'Right',
  'to-br': 'Bottom-right',
  'to-b': 'Bottom',
  'to-bl': 'Bottom-left',
  'to-l': 'Left',
  'to-tl': 'Top-left',
};

// Presented as a modal (see (generate)/_layout.tsx) over Generate, matching
// IosDesignSheet.dc.html / IosDesignAdvanced.dc.html's bottom sheet with a
// Basics/Advanced segmented header.
export default function DesignScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { fgColor, setFgColor, bgColor, setBgColor, design, setDesign, ecLevel } = useQrContent();
  const [tab, setTab] = useState<'basics' | 'advanced'>('basics');

  const fillType = design.fgGradient ? design.fgGradient.type : 'solid';

  const reset = () => {
    setFgColor(DEFAULT_QR_FG_COLOR);
    setBgColor(DEFAULT_QR_BG_COLOR);
    setDesign(DEFAULT_QR_DESIGN_CONFIG);
  };

  const riskyPatternAtLowReliability =
    (design.pixelPattern === 'Dots' || design.pixelPattern === 'Fluid') && ecLevel === 'L';

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceRaised }]}>
      <View style={styles.header}>
        <PressableScale onPress={reset} accessibilityRole="button">
          <ThemedText type="label" themeColor="action">
            Reset
          </ThemedText>
        </PressableScale>
        <SegmentedControl
          options={[
            { value: 'basics', label: 'Basics' },
            { value: 'advanced', label: 'Advanced' },
          ]}
          value={tab}
          onChange={setTab}
          style={styles.tabs}
        />
        <PressableScale onPress={() => router.back()} accessibilityRole="button">
          <ThemedText type="label" themeColor="action">
            Done
          </ThemedText>
        </PressableScale>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {tab === 'basics' ? (
          <>
            <View style={styles.row}>
              <ColorChip label="Foreground" value={fgColor} onChange={setFgColor} />
              <ColorChip label="Background" value={bgColor} onChange={setBgColor} />
            </View>

            <Section label="Eye border">
              <SwatchRow
                items={EYE_FRAME_SHAPES}
                selected={design.eyeFrameShape}
                onSelect={(eyeFrameShape) => setDesign({ eyeFrameShape })}
                keyOf={(s) => s}
                renderIcon={(shape) => <EyeFrameIcon shape={shape} color={theme.textPrimary} />}
              />
            </Section>

            <Section label="Pixel pattern">
              <SwatchRow
                items={PIXEL_PATTERNS}
                selected={design.pixelPattern}
                onSelect={(pixelPattern) => setDesign({ pixelPattern })}
                keyOf={(p) => p}
                renderIcon={(pattern) => <PixelPatternIcon pattern={pattern} color={theme.textPrimary} />}
              />
            </Section>

            {riskyPatternAtLowReliability ? (
              <Callout text="Dots at Low reliability can fail on worn prints. Raise reliability to High." />
            ) : null}
          </>
        ) : (
          <>
            <Section label="Foreground fill">
              <SegmentedControl
                options={[
                  { value: 'solid', label: 'Solid' },
                  { value: 'linear', label: 'Linear' },
                  { value: 'radial', label: 'Radial' },
                ]}
                value={fillType}
                onChange={(type) => {
                  if (type === 'solid') {
                    setDesign({ fgGradient: null });
                  } else {
                    setDesign({
                      fgGradient: {
                        type,
                        from: design.fgGradient?.from ?? fgColor,
                        to: design.fgGradient?.to ?? theme.action,
                        direction: design.fgGradient?.direction ?? 'to-br',
                      },
                    });
                  }
                }}
              />
              {design.fgGradient ? (
                <>
                  <View style={styles.row}>
                    <ColorChip
                      label="From"
                      value={design.fgGradient.from}
                      onChange={(from) => setDesign({ fgGradient: { ...design.fgGradient!, from } })}
                    />
                    <ColorChip
                      label="To"
                      value={design.fgGradient.to}
                      onChange={(to) => setDesign({ fgGradient: { ...design.fgGradient!, to } })}
                    />
                  </View>
                  {design.fgGradient.type === 'linear' ? (
                    <PressableScale
                      onPress={() => {
                        const i = GRADIENT_DIRECTIONS.indexOf(design.fgGradient!.direction);
                        const direction = GRADIENT_DIRECTIONS[(i + 1) % GRADIENT_DIRECTIONS.length];
                        setDesign({ fgGradient: { ...design.fgGradient!, direction } });
                      }}
                      accessibilityRole="button"
                      style={[styles.directionRow, { backgroundColor: theme.surfaceRaised }]}>
                      <ThemedText type="body">Direction</ThemedText>
                      <ThemedText type="body" themeColor="textSecondary">
                        {DIRECTION_LABELS[design.fgGradient.direction]}
                      </ThemedText>
                    </PressableScale>
                  ) : null}
                </>
              ) : null}
            </Section>

            <Section label="Eye centre">
              <SwatchRow
                items={EYE_CENTER_SHAPES}
                selected={design.eyeCenterShape}
                onSelect={(eyeCenterShape) => setDesign({ eyeCenterShape })}
                keyOf={(s) => s}
                renderIcon={(shape) => <EyeCenterIcon shape={shape} color={theme.textPrimary} />}
              />
            </Section>

            <View style={styles.row}>
              <ColorChip
                label="Eye border"
                value={design.eyeFrameColor ?? fgColor}
                onChange={(eyeFrameColor) => setDesign({ eyeFrameColor })}
              />
              <ColorChip
                label="Eye centre"
                value={design.eyeCenterColor ?? fgColor}
                onChange={(eyeCenterColor) => setDesign({ eyeCenterColor })}
              />
            </View>
          </>
        )}

        <PressableScale
          onPress={() => router.back()}
          accessibilityRole="button"
          style={[styles.applyButton, { backgroundColor: theme.action }]}>
          <Check size={20} color={theme.actionFg} />
          <ThemedText type="label" themeColor="actionFg">
            Apply design
          </ThemedText>
        </PressableScale>
      </ScrollView>
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: Spacing.xs }}>
      <ThemedText type="label" themeColor="textSecondary">
        {label}
      </ThemedText>
      {children}
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
  tabs: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  directionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    height: 50,
    borderRadius: Radius.full,
  },
});
