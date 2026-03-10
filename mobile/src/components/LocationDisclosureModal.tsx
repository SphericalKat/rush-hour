import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';
import { useTheme } from '../hooks/useTheme';

interface Props {
  visible: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function LocationDisclosureModal({ visible, onConfirm, onDismiss }: Props) {
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss} />
      <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + 16, borderColor: colors.border }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />

        <View style={[styles.iconWrap, { backgroundColor: colors.primary + '18' }]}>
          <Ionicons name="navigate" size={28} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Location access
        </Text>

        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Rush Hour will use your GPS location in the background while sharing is on. Your coordinates are sent to other passengers tracking the same train so they can see where it is. Your location is never stored on our servers and stops being shared the moment you turn it off.
        </Text>

        <View style={[styles.row, { borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.note, { color: colors.textTertiary }]}>
            No account required. No data retained.
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity activeOpacity={0.8} onPress={onConfirm}>
            <View style={[styles.btn, { backgroundColor: colors.primary, borderRadius: radius.lg }]}>
              <Text style={[styles.btnText, { color: colors.textOnPrimary }]}>
                Continue
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.6} onPress={onDismiss}>
            <View style={[styles.btn, styles.btnOutline, { borderColor: colors.separator, borderRadius: radius.lg }]}>
              <Text style={[styles.btnText, { color: colors.text }]}>
                Not now
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 24,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
    marginBottom: 24,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  note: {
    fontSize: 12,
  },
  actions: {
    alignSelf: 'stretch',
    gap: 10,
  },
  btn: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnOutline: {
    borderWidth: 1,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
