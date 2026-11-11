import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type Tone = 'info' | 'warning' | 'danger' | 'success';

const TONES: Record<
  Tone,
  { bg: string; border: string; fg: string; icon: string }
> = {
  info: {
    bg: colors.surfaceMuted,
    border: colors.line,
    fg: colors.inkSoft,
    icon: 'information-outline',
  },
  warning: {
    bg: colors.goldSoft,
    border: '#E7D4A8',
    fg: colors.goldInk,
    icon: 'alert-outline',
  },
  danger: {
    bg: colors.dangerSoft,
    border: '#EFC7C2',
    fg: colors.dangerInk,
    icon: 'alert-circle-outline',
  },
  success: {
    bg: colors.tealSoft,
    border: '#C4E2D8',
    fg: colors.tealInk,
    icon: 'check-circle-outline',
  },
};

type Props = {
  tone?: Tone;
  title?: string;
  message?: string;
  icon?: IconName;
  action?: ReactNode;
  style?: object;
};

export function InfoBanner({
  tone = 'info',
  title,
  message,
  icon,
  action,
  style,
}: Props) {
  const palette = TONES[tone];

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      <MaterialCommunityIcons
        name={(icon || palette.icon) as IconName}
        size={20}
        color={palette.fg}
        style={styles.icon}
      />
      <View style={styles.copy}>
        {title ? (
          <AppText variant="titleSmall" style={{ color: palette.fg }}>
            {title}
          </AppText>
        ) : null}
        {message ? (
          <AppText
            variant="bodySmall"
            style={[styles.message, { color: palette.fg }]}
          >
            {message}
          </AppText>
        ) : null}
        {action ? <View style={styles.action}>{action}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.md,
    alignItems: 'flex-start',
  },
  icon: {
    marginTop: 1,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  message: {
    fontFamily: fonts.regular,
    opacity: 0.9,
  },
  action: {
    marginTop: spacing.xs,
  },
});
