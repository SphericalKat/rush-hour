import createIconSet from '@expo/vector-icons/createIconSet';
import type { ComponentProps } from 'react';
import glyphMap from './phosphor-glyphmap.json';

export const PhosphorRegular = createIconSet(
  glyphMap,
  'Phosphor',
  require('@phosphor-icons/web/regular/Phosphor.ttf'),
);

export const PhosphorFill = createIconSet(
  glyphMap,
  'Phosphor-Fill',
  require('@phosphor-icons/web/fill/Phosphor-Fill.ttf'),
);

export type IconName = keyof typeof glyphMap;

type Props = ComponentProps<typeof PhosphorRegular> & {
  weight?: 'regular' | 'fill';
};

export function Icon({ weight = 'regular', ...props }: Props) {
  const Glyphs = weight === 'fill' ? PhosphorFill : PhosphorRegular;
  return <Glyphs {...props} />;
}
