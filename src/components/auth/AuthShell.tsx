import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';
import type { PropsWithChildren, ReactNode } from 'react';

import { AppLogo } from '@/components/ui/AppLogo';
import { AppText } from '@/components/ui/AppText';
import { KeyboardScreen, ScreenScroll } from '@/components/ui/Screen';
import { colors, fonts, spacing } from '@/theme/tokens';

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
  onBack,
}: PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  footer?: ReactNode;
  onBack?: () => void;
}>) {
  return (
    <KeyboardScreen>
      <ScreenScroll
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomInset={48}
      >
        {onBack ? (
          <Pressable onPress={onBack} style={styles.back} accessibilityRole="button">
            <MaterialCommunityIcons
              name="arrow-left"
              size={18}
              color={colors.mutedStrong}
            />
            <AppText variant="labelMedium" color={colors.mutedStrong}>
              Kembali
            </AppText>
          </Pressable>
        ) : null}

        <View style={styles.brand}>
          <AppLogo size={42} />
          <View>
            <AppText variant="labelSmall" color={colors.ink} style={styles.brandName}>
              NOXARIANET
            </AppText>
            <AppText variant="bodySmall" color={colors.muted} style={styles.brandSub}>
              STORE
            </AppText>
          </View>
        </View>

        <View style={styles.heading}>
          <AppText variant="labelSmall" color={colors.coralDark} style={styles.eyebrow}>
            {eyebrow.toUpperCase()}
          </AppText>
          <AppText variant="headlineLarge">{title}</AppText>
          <AppText variant="bodyMedium" color={colors.muted} style={styles.description}>
            {description}
          </AppText>
        </View>

        <View style={styles.body}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScreenScroll>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: spacing.lg,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    minHeight: 40,
    marginBottom: spacing.base,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandName: {
    letterSpacing: 2.2,
    fontFamily: fonts.monoMedium,
  },
  brandSub: {
    letterSpacing: 4.4,
    fontFamily: fonts.mono,
    marginTop: -1,
  },
  heading: {
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  eyebrow: {
    letterSpacing: 1.6,
  },
  description: {
    maxWidth: 380,
    fontFamily: fonts.regular,
  },
  body: {
    marginTop: spacing.xl,
    gap: spacing.base,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
});
