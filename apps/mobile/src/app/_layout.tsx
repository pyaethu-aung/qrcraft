import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { Appearance, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { QrContentProvider } from '@/hooks/qr-content-store';
import { getSettings } from '@/utils/storage';

void SplashScreen.preventAutoHideAsync();

// Applied once at module load (not inside an effect) so the override takes
// effect before the first paint — Settings' theme control re-applies it via
// the same Appearance.setColorScheme call when changed at runtime. Always
// calls setColorScheme, even for 'system' ('unspecified' clears it) rather
// than skipping the call — Appearance's override is native-process state,
// not re-derived from MMKV on its own, so a 'system' persisted setting has
// to actively clear a stray override (e.g. left over from a previous JS
// bundle reload within the same long-lived native process) instead of just
// hoping none is set.
const persistedThemeOverride = getSettings().themeOverride;
Appearance.setColorScheme(persistedThemeOverride === 'system' ? 'unspecified' : persistedThemeOverride);

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {/* Above AppTabs, not scoped to the Generate stack alone: Scan
          Result's "Recreate" and Saved's "load into Generate" both need
          to reach this same store from their own tab's stack. */}
      <QrContentProvider>
        <AnimatedSplashOverlay />
        <AppTabs />
      </QrContentProvider>
    </ThemeProvider>
  );
}
