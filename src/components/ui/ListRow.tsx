import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];
type Tone = 'default' | 'danger' | 'teal';

const TONES: Record<Tone, { bg: string; fg: string }> = {
  default: { bg: colors.coralSoft, fg: colors.coralDark },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  teal: { bg: colors.tealSoft, fg: colors.teal },
};

export function ListRow({
  icon,
  title,
  description,
  onPress,
  right,
  tone = 'default',
  showDivider = true,
}: {
  icon: IconName;
  title: string;
  description?: string;
  onPress?: () => void;
  right?: ReactNode;
  tone?: Tone;
  showDivider?: boolean;
}) {
  const palette = TONES[tone];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [
        styles.row,
        showDivider && styles.divider,
        pressed && onPress ? styles.pressed : null,
      ]}
    >
      <View style={[styles.icon, { backgroundColor: palette.bg }]}>
        <MaterialCommunityIcons name={icon} size={20} color={palette.fg} />
      </View>
      <View style={styles.copy}>
        <AppText variant="titleMedium">{title}</AppText>
        {description ? (
          <AppText variant="bodySmall" color={colors.muted}>
            {description}
          </AppText>
        ) : null}
      </View>
      {right ??
        (onPress ? (
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.lineStrong}
          />
        ) : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  pressed: {
    opacity: 0.65,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontFamily: fonts.semiBold,
  },
});
