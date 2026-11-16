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
      textColor={rest.textColor ?? '#FFFFFF'}
      style={[
        styles.primaryGlass,
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
        styles.secondaryGlass,
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

export function GlassButton({
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
        styles.frostedGlass,
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
  fullWidth: {
    alignSelf: 'stretch',
  },
  primaryGlass: {
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    shadowColor: colors.coralDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 4,
  },
  secondaryGlass: {
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.2,
    borderColor: 'rgba(77, 27, 140, 0.2)',
    shadowColor: colors.coralDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  frostedGlass: {
    borderRadius: 16,
    backgroundColor: 'rgba(77, 27, 140, 0.08)',
    borderWidth: 1.2,
    borderColor: 'rgba(77, 27, 140, 0.16)',
    shadowColor: colors.coralDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
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
    borderRadius: radius.md,
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
