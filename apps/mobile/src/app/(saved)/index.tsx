import { useFocusEffect } from 'expo-router';
import { Bookmark, Plus, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { QrPreview } from '@/components/qr-preview';
import { ThemedText } from '@/components/themed-text';
import { MinTouchTarget, Radius, ScrollContentBottomInset, Spacing } from '@/constants/theme';
import { useQrContent } from '@/hooks/qr-content-store';
import { useTheme } from '@/hooks/use-theme';
import { addSavedCode, getSavedCodes, MAX_SAVED_CODES, removeSavedCode, type SavedCode } from '@/utils/storage';

export default function SavedScreen() {
  const theme = useTheme();
  const {
    liveValue,
    contentMode,
    ecLevel,
    fgColor,
    bgColor,
    design,
    setText,
    setContentMode,
    setEcLevel,
    setFgColor,
    setBgColor,
    setDesign,
  } = useQrContent();
  const [codes, setCodes] = useState<SavedCode[]>([]);

  // mmkv is synchronous, so a plain re-read on focus (not a subscription)
  // is enough to reflect deletes/saves made from any tab.
  useFocusEffect(
    useCallback(() => {
      setCodes(getSavedCodes());
    }, []),
  );

  const canSaveCurrent = Boolean(liveValue) && codes.length < MAX_SAVED_CODES;

  const handleSaveCurrent = () => {
    if (!canSaveCurrent) return;
    const result = addSavedCode({ value: liveValue, contentMode, ecLevel, fgColor, bgColor, design });
    if (result) setCodes(result.all);
  };

  const handleDelete = (id: string) => {
    setCodes(removeSavedCode(id));
  };

  const handleLoad = (code: SavedCode) => {
    setContentMode('text');
    setText(code.value);
    setEcLevel(code.ecLevel);
    setFgColor(code.fgColor);
    setBgColor(code.bgColor);
    setDesign(code.design);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.surface }]}
      contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <ThemedText type="label" themeColor="textSecondary">
          Designs
        </ThemedText>
        <ThemedText type="label" themeColor="textSecondary">
          {codes.length} of {MAX_SAVED_CODES}
        </ThemedText>
      </View>

      <PressableScale
        disabled={!canSaveCurrent}
        onPress={handleSaveCurrent}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSaveCurrent }}
        style={[
          styles.saveCurrent,
          { backgroundColor: theme.surfaceRaised, opacity: canSaveCurrent ? 1 : 0.5, minHeight: MinTouchTarget },
        ]}>
        <Plus size={18} color={theme.action} />
        <ThemedText type="label" themeColor="action">
          Save current
        </ThemedText>
      </PressableScale>

      {codes.length === 0 ? (
        <ThemedText type="body" themeColor="textSecondary" style={styles.emptyText}>
          Codes you save from Generate will appear here.
        </ThemedText>
      ) : (
        <View style={styles.grid}>
          {codes.map((code) => (
            <PressableScale
              key={code.id}
              onPress={() => handleLoad(code)}
              accessibilityRole="button"
              style={[styles.cardWrap, { backgroundColor: theme.surfaceRaised }]}>
              <QrPreview
                value={code.value}
                ecLevel={code.ecLevel}
                fgColor={code.fgColor}
                bgColor={code.bgColor}
                design={code.design}
                size={72}
              />
              <ThemedText type="label" numberOfLines={1}>
                {code.design.pixelPattern}
              </ThemedText>
              <PressableScale
                onPress={() => handleDelete(code.id)}
                accessibilityRole="button"
                accessibilityLabel="Delete saved code"
                hitSlop={8}
                style={styles.deleteButton}>
                <Trash2 size={15} color={theme.textSecondary} />
              </PressableScale>
            </PressableScale>
          ))}
        </View>
      )}

      <View style={styles.tipRow}>
        <Bookmark size={13} color={theme.textSecondary} />
        <ThemedText type="body" themeColor="textSecondary" style={{ flex: 1 }}>
          Tap a saved design to load it back into Generate.
        </ThemedText>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  saveCurrent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.full,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  cardWrap: {
    width: '31%',
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: Spacing.xs / 2,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    padding: 4,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
});
