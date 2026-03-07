import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { lineColor } from '../theme';
import { useTheme } from '../hooks/useTheme';

interface Props {
  shortName: string;
  size?: 'sm' | 'md';
}

export function LineChip({ shortName, size = 'md' }: Props) {
  const { scheme } = useTheme();
  const color = lineColor(shortName, scheme);
  const small = size === 'sm';

  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: color + '1A' },
        small && styles.chipSm,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color },
          small && styles.labelSm,
        ]}
        numberOfLines={1}
      >
        {shortName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  chipSm: {
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  labelSm: {
    fontSize: 10,
  },
});
