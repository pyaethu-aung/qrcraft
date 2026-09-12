import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform, useColorScheme } from 'react-native';

import bookmarkIcon from '@/assets/images/tabIcons/bookmark.png';
import gridIcon from '@/assets/images/tabIcons/grid.png';
import viewfinderIcon from '@/assets/images/tabIcons/viewfinder.png';
import { Colors } from '@/constants/theme';

// Real native tab bar (UITabBarController on iOS, BottomNavigationView on
// Android) — not a JS-rendered approximation. On iOS 26 this automatically
// renders as the system's floating Liquid Glass capsule; the platform
// contract (docs/specs/qrcraft-mobile-design/Platforms.dc.html) describes
// that exact look, and native chrome gets it for free rather than faking it
// with backdrop-filter, matching the design's own guidance not to fake glass.
//
// iOS uses real SF Symbols (perfect vector quality, correct native sizing
// with zero asset work) rather than the hand-drawn PNGs — those PNGs also
// had a real bug: a single un-suffixed file gets treated as an unscaled @1x
// asset, so `grid.png` at 72x72px rendered at 72 *points* (3x too large).
// Fixed for the Android fallback (which still needs the PNGs) by
// generating a proper @1x/@2x/@3x set instead of one oversized file — see
// the icon generator script referenced in docs/specs/qrcraft-mobile.md.
export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.surfaceRaised}
      iconColor={{ default: colors.textSecondary, selected: colors.action }}
      labelStyle={{
        default: { color: colors.textSecondary },
        selected: { color: colors.action, fontWeight: '600' },
      }}>
      <NativeTabs.Trigger name="(generate)">
        <NativeTabs.Trigger.Label>Generate</NativeTabs.Trigger.Label>
        {Platform.OS === 'ios' ? (
          <NativeTabs.Trigger.Icon sf="square.grid.2x2" />
        ) : (
          <NativeTabs.Trigger.Icon src={gridIcon} renderingMode="template" />
        )}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(scan)">
        <NativeTabs.Trigger.Label>Scan</NativeTabs.Trigger.Label>
        {Platform.OS === 'ios' ? (
          <NativeTabs.Trigger.Icon sf="viewfinder" />
        ) : (
          <NativeTabs.Trigger.Icon src={viewfinderIcon} renderingMode="template" />
        )}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="(saved)">
        <NativeTabs.Trigger.Label>Saved</NativeTabs.Trigger.Label>
        {Platform.OS === 'ios' ? (
          <NativeTabs.Trigger.Icon sf="bookmark" />
        ) : (
          <NativeTabs.Trigger.Icon src={bookmarkIcon} renderingMode="template" />
        )}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
