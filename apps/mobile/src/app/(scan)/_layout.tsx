import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

// Native-stack per tab. Scan itself hides the native header entirely (its
// own dark camera overlay draws the "Scan" label — a light glass header
// bar over the viewfinder would fight the mockup's always-dark treatment);
// Scan result uses the normal light header like every other pushed screen.
// headerLargeTitle is off — see (generate)/_layout.tsx for why.
export default function ScanStackLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surfaceRaised },
        headerTintColor: colors.textPrimary,
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="result" options={{ title: 'Result' }} />
    </Stack>
  );
}
