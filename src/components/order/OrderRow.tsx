import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Clipboard from 'expo-clipboard';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import type { Order } from '@/api/types';
import { AppText } from '@/components/ui/AppText';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatDate, formatRupiah, truncate } from '@/lib/format';
import { cleanProductName } from '@/lib/products';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

export function OrderRow({
  order,
  onPress,
}: {
  order: Order;
  onPress: () => void;
}) {
  const copyOrderId = async () => {
    await Clipboard.setStringAsync(order.id);
    Alert.alert(
      'Berhasil Disalin! 📋',
      `Nomor pesanan "${order.id}" berhasil disalin ke clipboard.`,
      [{ text: 'OK', style: 'default' }],
    );
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Pesanan ${order.product}, ${order.status}`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Top Row: Status Pill & Date */}
      <View style={styles.top}>
        <StatusPill status={order.status} compact />
        <View style={styles.dateWrap}>
          <MaterialCommunityIcons
            name="calendar-clock-outline"
            size={13}
            color={colors.muted}
          />
          <AppText variant="labelSmall" color={colors.muted} style={styles.dateText}>
            {formatDate(order.timestamp)}
          </AppText>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Middle Row: Product Info & Price */}
      <View style={styles.middle}>
        <View style={styles.copy}>
          <AppText
            variant="titleMedium"
            style={styles.productTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {truncate(cleanProductName(order.product), 36)}
          </AppText>
          <AppText variant="bodySmall" color={colors.muted} numberOfLines={1}>
            {cleanProductName(order.variant)}
          </AppText>
        </View>

        <View style={styles.pricePill}>
          <AppText style={styles.priceText} numberOfLines={1}>
            {formatRupiah(order.price)}
          </AppText>
        </View>
      </View>

      {/* Bottom Row: Copyable Order ID & Action Button */}
      <View style={styles.bottom}>
        <Pressable
          onPress={copyOrderId}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Salin nomor pesanan ${order.id}`}
          style={({ pressed }) => [styles.orderIdBadge, pressed && styles.idPressed]}
        >
          <MaterialCommunityIcons
            name="content-copy"
            size={12}
            color={colors.coralDark}
          />
          <AppText
            variant="labelSmall"
            color={colors.coralDark}
            numberOfLines={1}
            style={styles.orderId}
          >
            {order.id}
          </AppText>
        </Pressable>

        <View style={styles.detailBtn}>
          <AppText variant="labelSmall" style={styles.detailBtnText}>
            Detail
          </AppText>
          <MaterialCommunityIcons
            name="chevron-right"
            size={16}
            color={colors.coralDark}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: 'rgba(77, 27, 140, 0.08)',
    padding: spacing.base,
    marginBottom: spacing.md, // Jeda yang jelas dan nyaman antar kartu pesanan
    shadowColor: colors.coralDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    gap: spacing.sm + 2,
  },
  cardPressed: {
    transform: [{ scale: 0.985 }],
    opacity: 0.88,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontFamily: fonts.medium,
    fontSize: 11.5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(77, 27, 140, 0.07)',
  },
  middle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  productTitle: {
    fontFamily: fonts.bold,
    fontSize: 15.5,
    lineHeight: 21,
    color: colors.ink,
  },
  pricePill: {
    backgroundColor: 'rgba(77, 27, 140, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(77, 27, 140, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    flexShrink: 0,
  },
  priceText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.coralDark,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: 2,
  },
  orderIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(77, 27, 140, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(77, 27, 140, 0.14)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '65%',
  },
  idPressed: {
    opacity: 0.65,
  },
  orderId: {
    fontFamily: fonts.monoMedium,
    fontSize: 11,
    flexShrink: 1,
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(77, 27, 140, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(77, 27, 140, 0.12)',
  },
  detailBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.coralDark,
  },
});
