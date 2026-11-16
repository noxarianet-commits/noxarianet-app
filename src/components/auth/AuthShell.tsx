import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';
import type { PropsWithChildren, ReactNode } from 'react';

import { AppLogo } from '@/components/ui/AppLogo';
import { AppText } from '@/components/ui/AppText';
import { KeyboardScreen, ScreenScroll } from '@/components/ui/Screen';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

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
      {/* Decorative Ambient Glass Glowing Orbs */}
      <View style={styles.ambientContainer} pointerEvents="none">
        <View style={styles.ambientOrbPurple} />
        <View style={styles.ambientOrbTeal} />
        <View style={styles.ambientOrbGold} />
      </View>

      <ScreenScroll
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomInset={48}
      >
        {onBack ? (
          <Pressable onPress={onBack} style={styles.back} accessibilityRole="button">
            <View style={styles.backIconCircle}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={18}
                color={colors.ink}
              />
            </View>
            <AppText variant="labelMedium" color={colors.ink}>
              Kembali
            </AppText>
          </Pressable>
        ) : null}

        {/* Premium Brand Header with Glass Badge */}
        <View style={styles.brandRow}>
          <View style={styles.logoGlassBadge}>
            <AppLogo size={32} rounded />
          </View>
          <View style={styles.brandCopy}>
            <AppText variant="titleMedium" style={styles.brandName}>
              NOXARIANET
            </AppText>
          </View>
        </View>

        {/* Modern Welcome Heading */}
        <View style={styles.heading}>
          <View style={styles.eyebrowPill}>
            <MaterialCommunityIcons name="star-four-points" size={12} color={colors.coral} />
            <AppText variant="labelSmall" color={colors.coral} style={styles.eyebrowText}>
              {eyebrow.toUpperCase()}
            </AppText>
          </View>
          <AppText variant="headlineLarge" style={styles.titleText}>
            {title}
          </AppText>
          <AppText variant="bodyMedium" color={colors.muted} style={styles.description}>
            {description}
          </AppText>
        </View>

        {/* Main Body (Forms) */}
        <View style={styles.body}>{children}</View>

        {/* Footer Actions */}
        {footer ? <View style={styles.footer}>{footer}</View> : null}

        {/* Trust Badges */}
        <View style={styles.trustRow}>
          <View style={styles.trustItem}>
            <MaterialCommunityIcons name="flash-outline" size={13} color={colors.coral} />
            <AppText variant="labelSmall" color={colors.muted} style={styles.trustText}>
              Otomatis 24/7
            </AppText>
          </View>
          <View style={styles.trustDot} />
          <View style={styles.trustItem}>
            <MaterialCommunityIcons name="shield-check-outline" size={13} color={colors.teal} />
            <AppText variant="labelSmall" color={colors.muted} style={styles.trustText}>
              100% Aman
            </AppText>
          </View>
          <View style={styles.trustDot} />
          <View style={styles.trustItem}>
            <MaterialCommunityIcons name="headset" size={13} color={colors.gold} />
            <AppText variant="labelSmall" color={colors.muted} style={styles.trustText}>
              Bantuan CS
            </AppText>
          </View>
        </View>
      </ScreenScroll>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  ambientContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  ambientOrbPurple: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(77, 27, 140, 0.08)',
  },
  ambientOrbTeal: {
    position: 'absolute',
    top: 240,
    left: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 191, 165, 0.06)',
  },
  ambientOrbGold: {
    position: 'absolute',
    bottom: 20,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(189, 136, 40, 0.05)',
  },
  content: {
    paddingTop: spacing.lg,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    minHeight: 40,
    marginBottom: spacing.base,
  },
  backIconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoGlassBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  brandCopy: {
    justifyContent: 'center',
    gap: 1,
  },
  brandName: {
    letterSpacing: 0.8,
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: colors.ink,
  },
  heading: {
    marginTop: spacing.xl,
    gap: spacing.xs,
  },
  eyebrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.coralSoft,
    borderWidth: 1,
    borderColor: 'rgba(77, 27, 140, 0.12)',
    marginBottom: 4,
  },
  eyebrowText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  titleText: {
    fontFamily: fonts.extraBold,
    color: colors.ink,
    fontSize: 26,
    lineHeight: 34,
  },
  description: {
    maxWidth: 380,
    fontFamily: fonts.regular,
    lineHeight: 20,
    fontSize: 13.5,
  },
  body: {
    marginTop: spacing.lg,
    gap: spacing.base,
  },
  footer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingTop: spacing.base,
    borderTopWidth: 1,
    borderTopColor: 'rgba(231, 226, 241, 0.6)',
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  trustDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.lineStrong,
  },
});
