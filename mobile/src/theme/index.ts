import { Platform } from 'react-native';

// Semantic / fixed colors that don't change with system theme.
// These are intentional brand/status colors, not structural palette.
const fixedLight = {
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#EF4444',
  ac: '#0891B2',
  trainSlow: '#EAB308',
  trainFast: '#EF4444',
  trainAC: '#2563EB',
  countdownUrgent: '#EA580C',
  countdownDue: '#DC2626',
  cr: '#2563EB',
  wr: '#0D9668',
  harbor: '#7C3AED',
};

const fixedDark = {
  success: '#22C55E',
  warning: '#FBBF24',
  danger: '#F87171',
  ac: '#22D3EE',
  trainSlow: '#FBBF24',
  trainFast: '#F87171',
  trainAC: '#60A5FA',
  countdownUrgent: '#FB923C',
  countdownDue: '#EF4444',
  cr: '#60A5FA',
  wr: '#34D399',
  harbor: '#A78BFA',
};

// Apple's UIKit semantic color hex values.
// These make the app feel native on iOS: proper system grays, backgrounds,
// and text colors that match the rest of the OS.
const iosLightColors = {
  primary: '#007AFF',           // systemBlue
  primaryMuted: '#E8F0FE',
  background: '#F2F2F7',       // systemGroupedBackground
  surface: '#FFFFFF',           // secondarySystemGroupedBackground
  surfaceSecondary: '#E5E5EA', // systemGray5
  border: '#C6C6C8',           // opaqueSeparator
  separator: '#C6C6C8',        // opaqueSeparator
  text: '#000000',              // label
  textSecondary: '#3C3C43',    // secondaryLabel (opaque)
  textTertiary: '#8E8E93',     // systemGray
  textOnPrimary: '#FFFFFF',
  platform: '#007AFF',
  platformMuted: '#E8F0FE',
  lineDefault: '#8E8E93',
  ...fixedLight,
};

const iosDarkColors: typeof iosLightColors = {
  primary: '#0A84FF',           // systemBlue (dark)
  primaryMuted: '#1C2A3D',
  background: '#000000',       // systemBackground
  surface: '#1C1C1E',          // secondarySystemBackground
  surfaceSecondary: '#2C2C2E', // tertiarySystemBackground
  border: '#38383A',           // opaqueSeparator (dark)
  separator: '#38383A',
  text: '#FFFFFF',              // label (dark)
  textSecondary: '#EBEBF5',    // secondaryLabel (dark, opaque)
  textTertiary: '#636366',     // systemGray2 (dark)
  textOnPrimary: '#000000',
  platform: '#0A84FF',
  platformMuted: '#1C2A3D',
  lineDefault: '#636366',
  ...fixedDark,
};

// Android / fallback palette. Our brand green Material palette.
// On Android 12+, this is overridden by Material You dynamic colors via useTheme.
export const lightColors = {
  primary: '#0D9668',
  primaryMuted: '#ECFDF5',
  background: '#F0F5F3',
  surface: '#FFFFFF',
  surfaceSecondary: '#E8EFEC',
  border: '#C6D5CE',
  separator: '#D5E0DA',
  text: '#1A2E24',
  textSecondary: '#5A7267',
  textTertiary: '#8DA39A',
  textOnPrimary: '#FFFFFF',
  platform: '#0D9668',
  platformMuted: '#D1FAE5',
  lineDefault: '#5A7267',
  ...fixedLight,
};

export const darkColors: typeof lightColors = {
  primary: '#34D399',
  primaryMuted: '#052E1C',
  background: '#0A0F0D',
  surface: '#141C18',
  surfaceSecondary: '#1E2A24',
  border: '#2D3F36',
  separator: '#1E2A24',
  text: '#F0FAF5',
  textSecondary: '#94B8A7',
  textTertiary: '#5E8272',
  textOnPrimary: '#000000',
  platform: '#34D399',
  platformMuted: '#052E1C',
  lineDefault: '#94B8A7',
  ...fixedDark,
};

export type AppColors = typeof lightColors;

// Return the platform-appropriate static palette.
export function getStaticColors(scheme: 'light' | 'dark'): AppColors {
  if (Platform.OS === 'ios') {
    return scheme === 'dark' ? iosDarkColors : iosLightColors;
  }
  return scheme === 'dark' ? darkColors : lightColors;
}

// Map Material 3 color scheme tokens to our app color tokens (Android only).
export function mapM3ToAppColors(
  m3: Record<string, any>,
  scheme: 'light' | 'dark',
): AppColors {
  const fixed = scheme === 'dark' ? fixedDark : fixedLight;
  return {
    primary: m3.primary,
    primaryMuted: m3.primaryContainer,
    background: m3.background,
    surface: m3.surface,
    surfaceSecondary: m3.secondaryContainer ?? m3.surfaceVariant,
    border: m3.outlineVariant ?? m3.outline,
    separator: m3.outlineVariant ?? m3.outline,
    text: m3.onBackground,
    textSecondary: m3.onSurfaceVariant,
    textTertiary: m3.outline,
    textOnPrimary: m3.onPrimary,
    platform: m3.primary,
    platformMuted: m3.primaryContainer,
    lineDefault: m3.onSurfaceVariant,
    ...fixed,
  };
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

// iOS-inspired type scale that feels right on Android too
export const type = {
  largeTitle: { fontSize: 34, fontWeight: '700' as const, letterSpacing: 0.4 },
  title1: { fontSize: 28, fontWeight: '700' as const },
  title2: { fontSize: 22, fontWeight: '700' as const },
  title3: { fontSize: 20, fontWeight: '600' as const },
  headline: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 17, fontWeight: '400' as const },
  callout: { fontSize: 16, fontWeight: '400' as const },
  subhead: { fontSize: 15, fontWeight: '400' as const },
  footnote: { fontSize: 13, fontWeight: '400' as const },
  caption1: { fontSize: 12, fontWeight: '400' as const },
  caption2: { fontSize: 11, fontWeight: '400' as const },
} as const;

// No shadows by default, but keeping the helper around for rare use
export function shadow(
  _elevation: number,
  _color = '#000',
): Record<string, unknown> {
  return {};
}

// Map a line short_name to its brand color
export function lineColor(
  shortName: string | null | undefined,
  scheme: 'light' | 'dark',
): string {
  const fixed = scheme === 'dark' ? fixedDark : fixedLight;
  if (!shortName) return scheme === 'dark' ? darkColors.lineDefault : lightColors.lineDefault;
  const key = shortName.toUpperCase();
  if (key.startsWith('CR-HL') || key.includes('HARBOR')) return fixed.harbor;
  if (key.startsWith('WR')) return fixed.wr;
  if (key.startsWith('CR')) return fixed.cr;
  return scheme === 'dark' ? darkColors.lineDefault : lightColors.lineDefault;
}
