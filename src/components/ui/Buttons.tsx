import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

import { colors, fonts, radius } from '@/theme/tokens';

type PaperButtonProps = ComponentProps<typeof Button>;

type Props = Omit<PaperButtonProps, 'mode'> & {
  children: ReactNode;
  fullWidth?: boolean;
  compact?: boolean;
};

export function PrimaryButton({
  children,
  fullWidth = true,
  style,
  contentStyle,
  labelStyle,
  ...rest
}: Props) {
  return (
    <Button
      mode="contained"
      {...rest}
      buttonColor={rest.buttonColor ?? colors.coralDark}
      textColor={rest.textColor ?? '#FFF8F3'}
      style={[
        styles.base,
        fullWidth ? styles.fullWidth : null,
        style,
      ]}
      contentStyle={[styles.content, contentStyle]}
      labelStyle={[styles.label, labelStyle]}
      uppercase={false}
    >
      {children}
    </Button>
  );
}

export function SecondaryButton({
  children,
  fullWidth = true,
  style,
  contentStyle,
  labelStyle,
  ...rest
}: Props) {
  return (
    <Button
      mode="outlined"
      {...rest}
      textColor={rest.textColor ?? colors.coralDark}
      style={[
        styles.base,
        styles.outlined,
        fullWidth ? styles.fullWidth : null,
        style,
      ]}
      contentStyle={[styles.content, contentStyle]}
      labelStyle={[styles.label, labelStyle]}
      uppercase={false}
    >
      {children}
    </Button>
  );
}

export function TextButton({
  children,
  style,
  contentStyle,
  labelStyle,
  compact = false,
  ...rest
}: Props) {
  return (
    <Button
      mode="text"
      {...rest}
      textColor={rest.textColor ?? colors.coralDark}
      style={[styles.text, style]}
      contentStyle={[
        styles.textContent,
        compact && styles.textContentCompact,
        contentStyle,
      ]}
      labelStyle={[styles.label, labelStyle]}
      uppercase={false}
    >
      {children}
    </Button>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.sm,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  content: {
    minHeight: 48,
    paddingHorizontal: 20,
  },
  label: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    letterSpacing: 0.1,
    textTransform: 'none',
  },
  text: {
    borderRadius: radius.sm,
  },
  textContent: {
    minHeight: 44,
    paddingHorizontal: 12,
  },
  textContentCompact: {
    minHeight: 32,
    paddingHorizontal: 6,
  },
});
