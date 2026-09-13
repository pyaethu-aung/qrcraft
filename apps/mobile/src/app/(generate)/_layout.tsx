import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

// Native-stack per tab (docs/specs/qrcraft-mobile.md build sequence step 3):
// Generate -> structured form (step 5) -> Design sheet (step 6). Content
// state (QrContentProvider) is provided at the root layout, above every
// tab, not here — Scan Result and Saved both need to reach it too.
//
// headerLargeTitle is deliberately off: under a NativeTabs tab, the large
// title's own text intermittently failed to paint (space reserved, blank
// header) — a real, reported bug, not a hypothetical. A normal header
// title always paints; the collapsing-large-title look from the mockups
// is a known, tracked gap (docs/specs/qrcraft-mobile.md).
export default function GenerateStackLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surfaceRaised },
        headerTintColor: colors.textPrimary,
      }}>
      <Stack.Screen name="index" options={{ title: 'Generate' }} />
      <Stack.Screen
        name="content"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="design"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
