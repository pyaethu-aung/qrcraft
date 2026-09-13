import type { QRContentMode } from '@qrcraft/core';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CONTENT_TYPE_GROUPS, CONTENT_TYPE_META } from '@/constants/content-types';
import { MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Step 1 of the content sheet: the "Grouped" direction picked from the
// /prototype content-type-picker comparison over a flat 3x3 grid and a
// descriptive list — category labels help someone scanning for "something
// like a contact card" find it faster than 9 equally-weighted tiles.
export function ContentTypeGrid({ onSelect }: { onSelect: (mode: QRContentMode) => void }) {
  return (
    <View style={styles.groups}>
      {CONTENT_TYPE_GROUPS.map((group) => (
        <View key={group.name} style={styles.group}>
          <ThemedText type="label" themeColor="textSecondary" style={styles.groupLabel}>
            {group.name.toUpperCase()}
          </ThemedText>
          <View style={styles.grid}>
            {group.modes.map((mode) => (
              <Tile key={mode} mode={mode} onPress={() => onSelect(mode)} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function Tile({ mode, onPress }: { mode: QRContentMode; onPress: () => void }) {
  const theme = useTheme();
  const { label, sfSymbol, Icon } = CONTENT_TYPE_META[mode];

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.tileWrapper}>
      <ThemedView type="surfaceRaised" glass style={[styles.tile, { minHeight: MinTouchTarget * 1.4 }]}>
        <View style={[styles.iconBadge, { backgroundColor: theme.actionDisabled }]}>
          <SymbolView name={{ ios: sfSymbol }} size={20} tintColor={theme.action} fallback={<Icon size={20} color={theme.action} />} />
        </View>
        <ThemedText type="label" themeColor="textPrimary" style={styles.tileLabel} numberOfLines={1}>
          {label}
        </ThemedText>
      </ThemedView>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  groups: {
    gap: Spacing.lg,
  },
  group: {
    gap: Spacing.xs,
  },
  groupLabel: {
    letterSpacing: 0.6,
    marginLeft: Spacing.xs / 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  // Fixed basis, no grow — a lone tile in the "Pay" group stays the same
  // size as every other tile instead of stretching to fill its row.
  tileWrapper: {
    flexBasis: '31%',
  },
  tile: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    textAlign: 'center',
  },
});
