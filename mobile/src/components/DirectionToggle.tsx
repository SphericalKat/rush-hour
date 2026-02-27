import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Direction } from '../api/types';
import { useTheme } from '../hooks/useTheme';

interface Props {
  value: Direction;
  onChange: (v: Direction) => void;
}

const OPTIONS: { label: string; value: Direction }[] = [
  { label: 'Down', value: 'down' },
  { label: 'Up', value: 'up' },
];

export function DirectionToggle({ value, onChange }: Props) {
  const { colors, radius } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceSecondary,
          borderRadius: radius.full,
          borderColor: colors.border,
        },
      ]}
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={styles.option}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            {active && (
              <View
                style={[
                  styles.activeIndicator,
                  {
                    backgroundColor: colors.surface,
                    borderRadius: radius.full,
                    ...Platform.select({
                      ios: {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.15,
                        shadowRadius: 3,
                      },
                      android: { elevation: 2 },
                    }),
                  },
                ]}
              />
            )}
            <Text
              style={[
                styles.label,
                {
                  color: active ? colors.text : colors.textSecondary,
                  fontWeight: active ? '600' : '400',
                },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
    alignSelf: 'center',
  },
  option: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minWidth: 80,
  },
  activeIndicator: {
    ...StyleSheet.absoluteFillObject,
    margin: 1,
  },
  label: {
    fontSize: 14,
    zIndex: 1,
  },
});
