import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type TextStyle } from 'react-native';
import { TextInput } from 'react-native-paper';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radius } from '@/theme/tokens';

type PaperInputProps = ComponentProps<typeof TextInput>;

type Props = Omit<PaperInputProps, 'mode'> & {
  errorText?: string;
  right?: ReactNode;
  hint?: string;
  contentStyle?: StyleProp<TextStyle>;
};

export function TextField({
  errorText,
  right,
  hint,
  style,
  contentStyle,
  ...rest
}: Props) {
  return (
    <View style={styles.wrap}>
      <TextInput
        mode="outlined"
        {...rest}
        right={right}
        error={!!errorText}
        outlineStyle={styles.outline}
        outlineColor={colors.lineStrong}
        activeOutlineColor={colors.coralDark}
        textColor={colors.ink}
        placeholderTextColor={colors.muted}
        selectionColor={colors.coral}
        style={[styles.input, style]}
        contentStyle={[styles.content, contentStyle]}
        theme={{
          colors: {
            background: colors.surface,
            onSurfaceVariant: colors.mutedStrong,
            primary: colors.coralDark,
            error: colors.danger,
          },
          roundness: radius.sm,
          fonts: {
            bodyLarge: {
              fontFamily: fonts.regular,
              fontWeight: 'normal',
              fontSize: 15,
              lineHeight: 22,
              letterSpacing: 0,
            },
          },
        }}
      />
      {errorText ? (
        <AppText variant="bodySmall" color={colors.danger} style={styles.helper}>
          {errorText}
        </AppText>
      ) : hint ? (
        <AppText variant="bodySmall" color={colors.muted} style={styles.helper}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  input: {
    backgroundColor: colors.surface,
    minHeight: 56,
  },
  content: {
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  outline: {
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  helper: {
    paddingHorizontal: 4,
  },
});
