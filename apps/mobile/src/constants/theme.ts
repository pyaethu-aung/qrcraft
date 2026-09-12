/**
 * QRCraft brand tokens for React Native — mirrors the CSS custom properties in
 * apps/web/src/index.css exactly (same hex/rgba values, light and dark), so the
 * mobile app reads as the same product per DESIGN.md. Do not invent new values
 * here; add a token to index.css first and port it.
 */
import { Platform } from 'react-native';

export const Colors = {
  light: {
    surface: '#F3EBE2',
    surfaceRaised: '#FAF6F1',
    surfaceOverlay: 'rgba(243, 235, 226, 0.7)',
    surfaceInset: '#E8DDD2',

    textPrimary: '#1C1A17',
    textSecondary: '#605A52',
    textDisabled: '#6E665C',

    borderSubtle: '#C5BEB6',
    borderStrong: '#877D70',

    action: '#A04D28',
    actionHover: '#8B4020',
    actionFg: '#FFFFFF',
    actionDisabled: '#E8C5B3',

    backdrop: 'rgba(26, 22, 18, 0.55)',
    focusRing: '#A04D28',
    link: '#A04D28',

    error: '#C53030',
    errorFg: '#FFFFFF',
    errorSurface: '#FEF2F2',
    errorBorder: '#FECACA',

    warning: '#7C4A18',
    warningSurface: '#FAF3E6',
    warningBorder: '#D4A850',
  },
  dark: {
    surface: '#1A1612',
    surfaceRaised: '#2A2420',
    surfaceOverlay: 'rgba(42, 36, 32, 0.7)',
    surfaceInset: 'rgba(255, 255, 255, 0.05)',

    textPrimary: '#F3EBE2',
    textSecondary: '#A89E93',
    textDisabled: '#948A7E',

    borderSubtle: 'rgba(255, 255, 255, 0.10)',
    borderStrong: 'rgba(255, 255, 255, 0.38)',

    action: '#D4916E',
    actionHover: '#E3A98B',
    actionFg: '#1A1612',
    actionDisabled: '#6B4B38',

    backdrop: 'rgba(26, 22, 18, 0.75)',
    focusRing: '#D4916E',
    link: '#D4916E',

    error: '#F87171',
    errorFg: '#1A1612',
    errorSurface: 'rgba(155, 27, 27, 0.2)',
    errorBorder: 'rgba(155, 27, 27, 0.5)',

    warning: '#D4A850',
    warningSurface: 'rgba(180, 120, 30, 0.15)',
    warningBorder: 'rgba(180, 120, 30, 0.35)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

/** DESIGN.md `rounded` scale. */
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

/** DESIGN.md `spacing` scale. */
export const Spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 32,
  '2xl': 40,
} as const;

/** DESIGN.md typography — system stack everywhere, Geist Mono for machine values only. */
export const Fonts = Platform.select({
  ios: { sans: 'system-ui', mono: 'ui-monospace' },
  default: { sans: 'normal', mono: 'monospace' },
});

// Platform contract (docs/specs/qrcraft-mobile-design/Platforms.dc.html):
// iOS floating glass capsule tab bar is inset 16pt, lifted 26pt off the home
// indicator, 60pt tall. Android's nav bar is flush to the edge, 80dp.
export const TabBarHeight = Platform.select({ ios: 60, android: 80 }) ?? 60
export const TabBarBottomInset = Platform.select({ ios: 26, android: 0 }) ?? 0
export const TabBarSideInset = Platform.select({ ios: 16, android: 0 }) ?? 0
// Scroll content needs this much bottom padding to clear the floating iOS bar
// (inset + height) so the last row never hides behind it; Android's bar is
// flush, so its own height is enough.
export const ScrollContentBottomInset =
  Platform.select({ ios: TabBarBottomInset + TabBarHeight, android: TabBarHeight }) ?? 0

export const MinTouchTarget = Platform.select({ ios: 44, android: 48 }) ?? 44
