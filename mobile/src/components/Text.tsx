import React from 'react';
import { Platform, Text as RNText, type TextProps } from 'react-native';

// Android uses the fontFamily name from the config plugin definition.
// iOS uses the PostScript/family name from the font file itself.
const FONT_FAMILY = Platform.OS === 'ios' ? 'DM Sans' : 'DMSans';

export function Text({ style, ...props }: TextProps) {
  return <RNText {...props} style={[{ fontFamily: FONT_FAMILY }, style]} />;
}
