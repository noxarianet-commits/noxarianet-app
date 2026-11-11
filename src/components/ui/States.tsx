import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/Buttons';
import { getErrorMessage } from '@/lib/errors';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function EmptyState({
  icon = 'package-variant-closed',
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.state}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={28} color={colors.coralDark} />
      </View>
      <AppText variant="titleLarge" align="center">
        {title}
      </AppText>
      {description ? (
        <AppText
          variant="bodyMedium"
          color={colors.muted}
          align="center"
          style={styles.description}
        >
          {description}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <PrimaryButton onPress={onAction} style={styles.action}>
          {actionLabel}
        </PrimaryButton>
      ) : null}
    </View>
  );
}

export function ErrorState({
  error,
  title = 'Gagal memuat data',
  onRetry,
  retryLabel = 'Coba lagi',
}: {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <View style={styles.state}>
      <View style={[styles.iconCircle, styles.dangerCircle]}>
        <MaterialCommunityIcons
          name="cloud-alert-outline"
          size={28}
          color={colors.danger}
        />
      </View>
      <AppText variant="titleLarge" align="center">
        {title}
      </AppText>
      <AppText
        variant="bodyMedium"
        color={colors.muted}
        align="center"
        style={styles.description}
      >
        {getErrorMessage(error)}
      </AppText>
      {onRetry ? (
        <PrimaryButton onPress={onRetry} style={styles.action}>
          {retryLabel}
        </PrimaryButton>
      ) : null}
    </View>
  );
}

export function LoadingState({
  label = 'Memuat…',
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  return (
    <View style={[styles.state, compact && styles.compact]}>
      <ActivityIndicator color={colors.coralDark} />
      <AppText variant="bodySmall" color={colors.muted} align="center">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    flex: 1,
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  compact: {
    minHeight: 160,
    flex: 0,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.coralSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  dangerCircle: {
    backgroundColor: colors.dangerSoft,
  },
  description: {
    maxWidth: 320,
    fontFamily: fonts.regular,
  },
  action: {
    marginTop: spacing.md,
    minWidth: 180,
  },
});
