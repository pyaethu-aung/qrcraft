import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

// Web is not a designed target for this app (out of scope per
// docs/specs/qrcraft-mobile.md); this keeps `expo start --web` functional
// without pretending to match the native platform contract.
export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="(generate)" href="/" asChild>
            <TabButton>Generate</TabButton>
          </TabTrigger>
          <TabTrigger name="(scan)" href="/(scan)" asChild>
            <TabButton>Scan</TabButton>
          </TabTrigger>
          <TabTrigger name="(saved)" href="/(saved)" asChild>
            <TabButton>Saved</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type={isFocused ? 'surfaceInset' : 'surfaceRaised'} style={styles.tabButtonView}>
        <ThemedText type="label" themeColor={isFocused ? 'textPrimary' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="surfaceRaised" style={styles.innerContainer}>
        <ThemedText type="label" style={styles.brandText}>
          QRCraft
        </ThemedText>
        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xl,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.xs,
    maxWidth: 800,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.xs / 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.md,
  },
});
