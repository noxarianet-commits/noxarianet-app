import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, spacing } from '@/theme/tokens';

type Props = {
  eyebrow?: string;
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: object;
};

export function SectionHeader({
  eyebrow,
  title,
  actionLabel,
  onAction,
  style,
}: Props) {
  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.copy}>
        {eyebrow ? (
          <AppText variant="labelSmall" color={colors.coralDark}>
            {eyebrow.toUpperCase()}
          </AppText>
        ) : null}
        {title ? (
          <AppText variant="titleLarge" numberOfLines={1}>
            {title}
          </AppText>
        ) : null}
      </View>
      {actionLabel ? (
        <AppText
          variant="labelMedium"
          color={onAction ? colors.coralDark : colors.muted}
          onPress={onAction}
          accessibilityRole={onAction ? 'button' : undefined}
          style={styles.action}
        >
          {actionLabel}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  action: {
    flexShrink: 0,
    paddingVertical: 8,
    paddingLeft: 12,
    fontFamily: fonts.semiBold,
  },
});
