import { useColorScheme } from 'react-native';
import { darkColors, lightColors, radius, shadow, spacing, type } from '../theme';

export function useTheme() {
  const raw = useColorScheme();
  const scheme: 'light' | 'dark' = raw === 'dark' ? 'dark' : 'light';
  return {
    colors: scheme === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    type,
    shadow,
    scheme,
  };
}
