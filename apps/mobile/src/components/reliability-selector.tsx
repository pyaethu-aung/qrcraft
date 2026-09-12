import type { QRErrorCorrectionLevel } from '@qrcraft/core';
import { View } from 'react-native';

import { SegmentedControl } from '@/components/segmented-control';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

const LEVELS: { value: QRErrorCorrectionLevel; label: string }[] = [
  { value: 'L', label: 'Low' },
  { value: 'M', label: 'Medium' },
  { value: 'Q', label: 'High' },
  { value: 'H', label: 'Max' },
];

export interface ReliabilitySelectorProps {
  value: QRErrorCorrectionLevel;
  onChange: (level: QRErrorCorrectionLevel) => void;
}

// "Scan reliability" segmented control (IosGenerate mockup) — maps the
// technical EC levels (L/M/Q/H) to the labels a non-technical user reads.
export function ReliabilitySelector({ value, onChange }: ReliabilitySelectorProps) {
  return (
    <View style={{ alignSelf: 'stretch' }}>
      <ThemedText type="label" themeColor="textSecondary" style={{ textAlign: 'center', marginBottom: Spacing.xs }}>
        Scan reliability
      </ThemedText>
      <SegmentedControl options={LEVELS} value={value} onChange={onChange} />
    </View>
  );
}
