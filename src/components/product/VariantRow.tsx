import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import type { ProductVariant } from '@/api/types';
import { AppText } from '@/components/ui/AppText';
import { formatNumber, formatRupiah } from '@/lib/format';
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
          {variant.name}
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
              {variant.note}
            </AppText>
          ) : null}
        </View>
      </View>

      <AppText
        variant="bodyMedium"
        weight="monoMedium"
        color={outOfStock ? colors.muted : colors.ink}
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
  },
  selected: {
    borderColor: colors.coral,
    backgroundColor: colors.coralSoft,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.75,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
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
  price: {
    fontFamily: fonts.monoMedium,
    fontSize: 13,
    textAlign: 'right',
    flexShrink: 0,
  },
});
