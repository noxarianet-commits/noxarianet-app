import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import type { ProductVariant } from '@/api/types';
import { AppText } from '@/components/ui/AppText';
import { formatNumber, formatRupiah } from '@/lib/format';
import { cleanProductName } from '@/lib/products';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

export function VariantRow({
  variant,
  selected,
  onPress,
}: {
  variant: ProductVariant;
  selected: boolean;
  onPress: () => void;
}) {
  const openDenom = !!variant.provider_meta?.open_denom;
  const outOfStock = !openDenom && variant.stock <= 0;
  const minQty = Number(variant.provider_meta?.min_qty) || 0;
  const maxQty = Number(variant.provider_meta?.max_qty) || 0;
  // Produk tagihan tidak punya harga tetap: nominal comes dari vendor.
  const isBill = variant.validation?.type === 'bill_inquiry' || variant.price <= 0;
  const fee = Number(variant.admin_fee ?? 0) || 0;

  return (
    <Pressable
      onPress={outOfStock ? undefined : onPress}
      disabled={outOfStock}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: outOfStock }}
      style={({ pressed }) => [
        styles.row,
        selected && styles.selected,
        outOfStock && styles.disabled,
        pressed && !outOfStock ? styles.pressed : null,
      ]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? (
          <MaterialCommunityIcons
            name="check"
            size={13}
            color={colors.surface}
          />
        ) : null}
      </View>

      <View style={styles.copy}>
        <AppText variant="titleMedium" numberOfLines={2}>
          {cleanProductName(variant.name)}
        </AppText>
        <View style={styles.meta}>
          {openDenom ? (
            <AppText variant="bodySmall" color={colors.muted}>
              Nominal bebas
              {minQty && maxQty
                ? ` · ${formatNumber(minQty)}–${formatNumber(maxQty)}`
                : ''}
            </AppText>
          ) : isBill ? (
            <AppText variant="bodySmall" color={colors.muted}>
              Nominal ditentukan setelah cek tagihan
            </AppText>
          ) : (
            <AppText
              variant="bodySmall"
              color={outOfStock ? colors.danger : colors.muted}
            >
              {outOfStock ? 'Stok habis' : `Stok ${formatNumber(variant.stock)}`}
            </AppText>
          )}
          {variant.note ? (
            <AppText variant="bodySmall" color={colors.muted} numberOfLines={1}>
              {cleanProductName(variant.note)}
            </AppText>
          ) : null}
        </View>
      </View>

      <View style={[styles.priceBadge, selected && styles.priceBadgeSelected]}>
        <AppText
          variant="bodyMedium"
          weight="monoMedium"
          color={outOfStock ? colors.muted : selected ? colors.coralDark : colors.ink}
          style={styles.price}
        >
          {openDenom
            ? 'Bebas'
            : isBill
              ? fee > 0
                ? formatRupiah(fee)
                : 'Cek'
              : formatRupiah(variant.price)}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderWidth: 1.2,
    borderColor: 'rgba(231, 226, 241, 0.85)',
    borderRadius: 16,
    shadowColor: '#4D1B8C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  selected: {
    borderColor: colors.coralDark,
    backgroundColor: 'rgba(244, 238, 253, 0.95)',
    borderWidth: 1.5,
    shadowColor: '#4D1B8C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    borderColor: 'rgba(164, 151, 185, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: colors.coralDark,
    borderColor: colors.coralDark,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  meta: {
    gap: 1,
  },
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(244, 242, 248, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(231, 226, 241, 0.6)',
    alignItems: 'flex-end',
  },
  priceBadgeSelected: {
    backgroundColor: 'rgba(77, 27, 140, 0.08)',
    borderColor: 'rgba(77, 27, 140, 0.2)',
  },
  price: {
    fontFamily: fonts.monoMedium,
    fontSize: 13,
    textAlign: 'right',
  },
});
