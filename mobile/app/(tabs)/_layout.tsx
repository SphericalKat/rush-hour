import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';

const FONT_FAMILY = Platform.OS === 'ios' ? 'DM Sans' : 'DMSans';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <NativeTabs tintColor={colors.primary} labelStyle={{ fontFamily: FONT_FAMILY }}>
      <NativeTabs.Trigger name="index">
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
      <NativeTabs.Trigger name="favorites">
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
      <NativeTabs.Trigger name="settings">
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
