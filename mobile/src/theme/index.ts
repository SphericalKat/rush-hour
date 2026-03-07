import { Platform } from 'react-native';

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
  // status
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#EF4444',
  // AC badge
  ac: '#0891B2',
  // train type leading bar
  trainSlow: '#EAB308',
  trainFast: '#EF4444',
  trainAC: '#2563EB',
  // countdown urgency
  countdownUrgent: '#EA580C',
  countdownDue: '#DC2626',
  // platform
  platform: '#0D9668',
  platformMuted: '#D1FAE5',
  // line colors (operator identity)
  cr: '#2563EB',
  wr: '#0D9668',
  harbor: '#7C3AED',
  lineDefault: '#5A7267',
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
  textOnPrimary: '#052E1C',
  success: '#22C55E',
  warning: '#FBBF24',
  danger: '#F87171',
  ac: '#22D3EE',
  trainSlow: '#FBBF24',
  trainFast: '#F87171',
  trainAC: '#60A5FA',
  countdownUrgent: '#FB923C',
  countdownDue: '#EF4444',
  platform: '#34D399',
  platformMuted: '#052E1C',
  cr: '#60A5FA',
  wr: '#34D399',
  harbor: '#A78BFA',
  lineDefault: '#94B8A7',
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

// Flat design — no shadows by default, but keep the helper for rare use
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
  const c = scheme === 'dark' ? darkColors : lightColors;
  if (!shortName) return c.lineDefault;
  const key = shortName.toUpperCase();
  if (key.startsWith('CR-HL') || key.includes('HARBOR')) return c.harbor;
  if (key.startsWith('WR')) return c.wr;
  if (key.startsWith('CR')) return c.cr;
  return c.lineDefault;
}
