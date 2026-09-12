import { Stack, useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { StyleSheet, useColorScheme } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { Colors, MinTouchTarget } from '@/constants/theme';

// Native-stack per tab: Saved's header carries the entry point into Settings
// (docs/specs/qrcraft-mobile-design/IosSaved.dc.html shows a trailing
// glass header button) — Settings is not its own tab. headerLargeTitle is
// off — see (generate)/_layout.tsx for why.
export default function SavedStackLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surfaceRaised },
        headerTintColor: colors.textPrimary,
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Saved',
          headerRight: () => (
            <PressableScale
              onPress={() => router.push('/(saved)/settings')}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              hitSlop={8}
              style={[styles.settingsButton, { minWidth: MinTouchTarget, minHeight: MinTouchTarget }]}>
              <Settings size={20} color={colors.action} />
            </PressableScale>
          ),
        }}
      />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  settingsButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
