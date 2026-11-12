import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, spacing } from '@/theme/tokens';

export function ReceiptRow({
  label,
  value,
  mono = false,
  strong = false,
  highlight = false,
  copyable = false,
  onCopy,
  valueColor,
  numberOfLines,
}: {
  label: string;
  value: string;
  mono?: boolean;
  strong?: boolean;
  highlight?: boolean;
  copyable?: boolean;
  onCopy?: () => void;
  valueColor?: string;
  numberOfLines?: number;
}) {
  const isStrong = strong || highlight;
  const resolvedColor =
    valueColor ?? (highlight ? colors.coralDark : colors.ink);

  const content = (
    <View style={styles.valueRow}>
      <AppText
        variant="bodySmall"
        color={resolvedColor}
        weight={mono ? 'monoMedium' : isStrong ? 'semiBold' : undefined}
        numberOfLines={numberOfLines}
        selectable={mono}
        style={[styles.value, mono && styles.mono]}
      >
        {value}
      </AppText>
      {copyable ? (
        <MaterialCommunityIcons
          name="content-copy"
          size={14}
          color={colors.muted}
          style={styles.copyIcon}
        />
      ) : null}
    </View>
  );

  return (
    <View style={styles.row}>
      <AppText variant="bodySmall" color={colors.muted} style={styles.label}>
        {label}
      </AppText>
      {copyable && onCopy ? (
        <Pressable
          onPress={onCopy}
          accessibilityRole="button"
          accessibilityLabel={`Salin ${label}`}
          style={styles.pressableValue}
        >
          {content}
        </Pressable>
      ) : (
        <View style={styles.valueWrap}>{content}</View>
      )}
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
  valueWrap: {
    flex: 1,
    minWidth: 0,
  },
  pressableValue: {
    flex: 1,
    minWidth: 0,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
  },
  copyIcon: {
    flexShrink: 0,
    marginLeft: 2,
  },
  mono: {
    fontFamily: fonts.monoMedium,
    letterSpacing: 0,
  },
});
