import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { useSettings } from '../../src/hooks/useSettings';
import { supportsDynamicColors } from '../../src/theme';

const FONT_FAMILY = Platform.OS === 'ios' ? 'DM Sans' : 'DMSans';

export default function TabLayout() {
  const { colors } = useTheme();
  const { settings } = useSettings();

  // On Android, override the native tab bar whenever dynamic colors
  // are not actively applied (unsupported or disabled) so the bar
  // matches the app's own color tokens instead of the system palette
  // or native theme colors.
  const needsManualColors =
    Platform.OS === 'android' && (!supportsDynamicColors() || !settings.dynamicColors);

  return (
    <NativeTabs
      tintColor={colors.primary}
      labelStyle={{ fontFamily: FONT_FAMILY }}
      {...(needsManualColors && {
        backgroundColor: colors.surface,
        indicatorColor: colors.primaryMuted,
      })}
    >
      <NativeTabs.Trigger name="index" contentStyle={{ backgroundColor: colors.background }}>
        <NativeTabs.Trigger.Label>Departures</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'tram', selected: 'tram.fill' }}
          src={
            <NativeTabs.Trigger.VectorIcon
              family={Ionicons}
              name="train-outline"
            />
          }
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="favorites" contentStyle={{ backgroundColor: colors.background }}>
        <NativeTabs.Trigger.Label>Favorites</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'heart', selected: 'heart.fill' }}
          src={
            <NativeTabs.Trigger.VectorIcon
              family={Ionicons}
              name="heart-outline"
            />
          }
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings" contentStyle={{ backgroundColor: colors.background }}>
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          src={
            <NativeTabs.Trigger.VectorIcon
              family={Ionicons}
              name="settings-outline"
            />
          }
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
