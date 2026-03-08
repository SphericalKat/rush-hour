import { useMaterial3Theme } from '@pchmn/expo-material3-theme';
import { useMemo } from 'react';
import { Platform, useColorScheme } from 'react-native';
import {
  getStaticColors,
  mapM3ToAppColors,
  radius,
  shadow,
  spacing,
  type,
} from '../theme';

// Brand green as fallback source color for M3 palette generation.
const BRAND_GREEN = '#0D9668';

export function useTheme() {
  const raw = useColorScheme();
  const scheme: 'light' | 'dark' = raw === 'dark' ? 'dark' : 'light';
  const { theme: m3 } = useMaterial3Theme({ fallbackSourceColor: BRAND_GREEN });

  const colors = useMemo(() => {
    // iOS: use Apple's semantic color values
    if (Platform.OS === 'ios') {
      return getStaticColors(scheme);
    }

    // Android: use Material You dynamic colors when available
    if (m3) {
      try {
        return mapM3ToAppColors(m3[scheme], scheme);
      } catch {
        // fall through
      }
    }
    return getStaticColors(scheme);
  }, [m3, scheme]);

  return {
    colors,
    spacing,
    radius,
    type,
    shadow,
    scheme,
  };
}
