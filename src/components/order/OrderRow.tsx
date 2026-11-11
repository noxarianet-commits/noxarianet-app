import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Order } from '@/api/types';
import { AppText } from '@/components/ui/AppText';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatDate, formatRupiah, truncate } from '@/lib/format';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

export function OrderRow({
  order,
  onPress,
}: {
  order: Order;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Pesanan ${order.product}, ${order.status}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <StatusPill status={order.status} compact />
        <AppText variant="labelSmall" color={colors.muted}>
          {formatDate(order.timestamp)}
        </AppText>
      </View>

      <View style={styles.middle}>
        <View style={styles.copy}>
          <AppText variant="titleMedium" numberOfLines={1}>
            {truncate(order.product, 34)}
          </AppText>
          <AppText variant="bodySmall" color={colors.muted} numberOfLines={1}>
            {order.variant}
          </AppText>
        </View>
        <AppText variant="bodyMedium" style={styles.price}>
          {formatRupiah(order.price)}
        </AppText>
      </View>

      <View style={styles.bottom}>
        <AppText variant="labelSmall" color={colors.muted} numberOfLines={1}>
          {order.id}
        </AppText>
        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color={colors.lineStrong}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.65,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  middle: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  price: {
    fontFamily: fonts.monoMedium,
    fontSize: 13,
    borderRadius: radius.sm,
    textAlign: 'right',
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
