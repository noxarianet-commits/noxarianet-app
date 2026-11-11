import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radius, statusTones } from '@/theme/tokens';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type Props = {
  status?: string | null;
  compact?: boolean;
};

export function StatusPill({ status, compact = false }: Props) {
  const tone = statusTones[status || ''] || {
    label: (status || 'Tidak diketahui').replace(/_/g, ' '),
    fg: colors.mutedStrong,
    bg: colors.surfaceMuted,
    icon: 'help-circle-outline',
  };

  return (
    <View
      style={[
        styles.pill,
        compact && styles.compact,
        { backgroundColor: tone.bg },
      ]}
    >
      <MaterialCommunityIcons
        name={tone.icon as IconName}
        size={compact ? 11 : 13}
        color={tone.fg}
      />
      <AppText
        variant="labelSmall"
        style={[
          styles.label,
          compact && styles.labelCompact,
          { color: tone.fg },
        ]}
        numberOfLines={1}
      >
        {tone.label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  compact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  label: {
    fontFamily: fonts.monoMedium,
    fontSize: 10,
    letterSpacing: 0.2,
    lineHeight: 14,
  },
  labelCompact: {
    fontSize: 9,
    lineHeight: 12,
  },
});
