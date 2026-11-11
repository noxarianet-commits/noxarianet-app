import type { ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import { colors, fonts } from '@/theme/tokens';

type PaperTextProps = ComponentProps<typeof Text>;

type Props = PaperTextProps & {
  color?: string;
  mono?: boolean;
  weight?: keyof typeof fonts;
  align?: 'left' | 'center' | 'right';
};

export function AppText({
  color = colors.ink,
  mono = false,
  weight,
  align,
  style,
  ...rest
}: Props) {
  return (
    <Text
      {...rest}
      style={[
        styles.base,
        { color },
        mono ? styles.mono : null,
        weight ? { fontFamily: fonts[weight] } : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
  mono: {
    fontFamily: fonts.mono,
    letterSpacing: 0,
  },
});
