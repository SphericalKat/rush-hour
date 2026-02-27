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
        { backgroundColor: color + '20', borderColor: color + '40' },
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
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  chipSm: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelSm: {
    fontSize: 10,
  },
});
