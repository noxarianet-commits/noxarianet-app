import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Clipboard from 'expo-clipboard';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

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

  const handleCopy = async () => {
    if (value) {
      await Clipboard.setStringAsync(value);
    }
    if (onCopy) {
      onCopy();
    }
    Alert.alert(
      'Berhasil Disalin! 📋',
      `${label} berhasil disalin ke clipboard:\n\n${value}`,
      [{ text: 'OK', style: 'default' }],
    );
  };

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
        <View style={styles.copyBadge}>
          <MaterialCommunityIcons
            name="content-copy"
            size={13}
            color={colors.coralDark}
          />
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.row}>
      <AppText variant="bodySmall" color={colors.muted} style={styles.label}>
        {label}
      </AppText>
      {copyable ? (
        <Pressable
          onPress={handleCopy}
          accessibilityRole="button"
          accessibilityLabel={`Salin ${label}`}
          hitSlop={8}
          style={({ pressed }) => [
            styles.pressableValue,
            pressed && styles.pressedValue,
          ]}
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
    alignItems: 'center',
    gap: spacing.base,
    paddingVertical: 7,
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
  pressedValue: {
    opacity: 0.65,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  value: {
    flexShrink: 1,
    textAlign: 'right',
  },
  copyBadge: {
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(77, 27, 140, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(77, 27, 140, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mono: {
    fontFamily: fonts.monoMedium,
    letterSpacing: 0,
  },
});
