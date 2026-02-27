import { Platform } from 'react-native';

// iOS system colors for a native feel; mirrored for Android.
export const lightColors = {
  primary: '#007AFF',
  primaryMuted: '#E5F1FF',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceSecondary: '#F2F2F7',
  border: '#E5E5EA',
  separator: '#C6C6C8',
  text: '#1C1C1E',
  textSecondary: '#6C6C70',
  textTertiary: '#AEAEB2',
  textOnPrimary: '#FFFFFF',
  // status
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  // AC badge
  ac: '#00C7BE',
  // line colors (operator identity)
  cr: '#0061FF',
  wr: '#00A86B',
  harbor: '#8E4EC6',
  lineDefault: '#636366',
};

export const darkColors: typeof lightColors = {
  primary: '#0A84FF',
  primaryMuted: '#001F3D',
  background: '#000000',
  surface: '#1C1C1E',
  surfaceSecondary: '#2C2C2E',
  border: '#38383A',
  separator: '#38383A',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  textOnPrimary: '#FFFFFF',
  success: '#30D158',
  warning: '#FF9F0A',
  danger: '#FF453A',
  ac: '#64D2FF',
  cr: '#409CFF',
  wr: '#30D158',
  harbor: '#BF5AF2',
  lineDefault: '#8E8E93',
};

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
  sm: 8,
  md: 12,
  lg: 16,
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

// Per-platform shadow helper
export function shadow(
  elevation: number,
  color = '#000',
): Record<string, unknown> {
  if (Platform.OS === 'android') {
    return { elevation };
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: elevation / 2 },
    shadowOpacity: 0.06 + elevation * 0.01,
    shadowRadius: elevation * 1.2,
  };
}

// Map a line short_name to its brand color
export function lineColor(
  shortName: string | null | undefined,
  scheme: 'light' | 'dark',
): string {
  const c = scheme === 'dark' ? darkColors : lightColors;
  if (!shortName) return c.lineDefault;
  const key = shortName.toUpperCase();
  if (key.startsWith('CR-HL') || key.includes('HARBOR')) return c.harbor;
  if (key.startsWith('WR')) return c.wr;
  if (key.startsWith('CR')) return c.cr;
  return c.lineDefault;
}
