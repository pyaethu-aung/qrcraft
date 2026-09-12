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
// the same Appearance.setColorScheme call when changed at runtime.
const persistedThemeOverride = getSettings().themeOverride;
if (persistedThemeOverride !== 'system') {
  Appearance.setColorScheme(persistedThemeOverride);
}

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
