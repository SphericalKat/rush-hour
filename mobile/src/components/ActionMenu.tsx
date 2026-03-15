import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../hooks/useTheme';

export interface ActionMenuItem {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  destructive?: boolean;
  onPress: () => void;
}

interface Props {
  visible: boolean;
  title?: string;
  items: ActionMenuItem[];
  onClose: () => void;
}

export function ActionMenu({ visible, title, items, onClose }: Props) {
  const { colors } = useTheme();
  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.38}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={[styles.background, { backgroundColor: colors.surface }]}
      handleIndicatorStyle={[styles.handle, { backgroundColor: colors.separator }]}
    >
      <BottomSheetView style={styles.content}>
        {title ? (
          <Text style={[styles.title, { color: colors.textSecondary }]} numberOfLines={2}>
            {title}
          </Text>
        ) : null}
        {items.map((item, i) => (
          <Pressable
            key={i}
            onPress={() => {
              onClose();
              setTimeout(item.onPress, 150);
            }}
            android_ripple={{ color: colors.textTertiary + '30', borderless: false, foreground: true }}
            style={[
              styles.item,
              { backgroundColor: colors.surface },
              i === 0 && styles.itemFirst,
              i === items.length - 1 && styles.itemLast,
            ]}
          >
            <View style={styles.itemRow}>
              {item.icon ? (
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={item.destructive ? colors.danger : colors.text}
                />
              ) : null}
              <Text
                style={[
                  styles.itemLabel,
                  { color: item.destructive ? colors.danger : colors.text },
                ]}
              >
                {item.label}
              </Text>
            </View>
          </Pressable>
        ))}
        <View style={{ height: 32 }} />
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    width: 44,
    height: 5,
  },
  content: {
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  item: {
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 28,
  },
  itemFirst: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  itemLast: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  itemLabel: {
    fontSize: 17,
    fontWeight: '500',
  },
});
