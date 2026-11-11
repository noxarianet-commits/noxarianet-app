import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, spacing } from '@/theme/tokens';

export function ReceiptRow({
  label,
  value,
  mono = false,
  strong = false,
  valueColor,
  numberOfLines,
}: {
  label: string;
  value: string;
  mono?: boolean;
  strong?: boolean;
  valueColor?: string;
  numberOfLines?: number;
}) {
  return (
    <View style={styles.row}>
      <AppText variant="bodySmall" color={colors.muted} style={styles.label}>
        {label}
      </AppText>
      <AppText
        variant="bodySmall"
        color={valueColor ?? colors.ink}
        weight={mono ? 'monoMedium' : strong ? 'semiBold' : undefined}
        numberOfLines={numberOfLines}
        selectable={mono}
        style={[styles.value, mono && styles.mono]}
      >
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.base,
    paddingVertical: 5,
  },
  label: {
    flexShrink: 0,
    maxWidth: '45%',
  },
  value: {
    flex: 1,
    textAlign: 'right',
  },
  mono: {
    fontFamily: fonts.monoMedium,
    letterSpacing: 0,
  },
});
