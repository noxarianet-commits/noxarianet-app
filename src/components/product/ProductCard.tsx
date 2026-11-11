import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Product } from '@/api/types';
import { ProductArtwork } from '@/components/product/ProductArtwork';
import { AppText } from '@/components/ui/AppText';
import { formatRupiah, truncate } from '@/lib/format';
import { isPostpaidProduct } from '@/lib/products';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

const VENDOR_LABELS: Record<string, string> = {
  sekalipay: 'Server 1',
  okeconnect: 'Server 2',
};

export function ProductCard({
  product,
  onPress,
  serverCount,
}: {
  product: Product;
  onPress: () => void;
  serverCount?: number;
}) {
  const variants = product.variants || [];
  const postpaid = isPostpaidProduct(product);
  const openDenom = variants.some(
    (variant) => variant.provider_meta?.open_denom,
  );
  const prices = variants
    .filter((variant) => !variant.provider_meta?.open_denom)
    .map((variant) => variant.price)
    .filter((price) => Number.isFinite(price) && price > 0);
  const fromPrice = prices.length ? Math.min(...prices) : null;
  const vendorLabel = postpaid
    ? 'Tagihan'
    : VENDOR_LABELS[product.vendor || ''] || 'Katalog';
  const totalServers = serverCount || product.servers?.length || 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${product.category}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.media}>
        <ProductArtwork product={product} size={52} />
      </View>

      <View style={styles.metaRow}>
        <AppText variant="labelSmall" color={colors.muted} numberOfLines={1}>
          {vendorLabel.toUpperCase()}
        </AppText>
        {totalServers > 1 && !postpaid ? (
          <View style={styles.serverBadge}>
            <AppText variant="labelSmall" color={colors.coralInk} style={styles.serverText}>
              {totalServers} SERVER
            </AppText>
          </View>
        ) : null}
        {postpaid && variants.length ? (
          <View style={styles.serverBadge}>
            <AppText variant="labelSmall" color={colors.coralInk} style={styles.serverText}>
              {variants.length} PILIHAN
            </AppText>
          </View>
        ) : null}
      </View>

      <AppText variant="titleMedium" numberOfLines={2} style={styles.name}>
        {truncate(product.name, 46)}
      </AppText>
      <AppText variant="bodySmall" color={colors.muted} numberOfLines={1}>
        {product.category}
      </AppText>

      <View style={styles.footer}>
        <View style={styles.priceWrap}>
          <AppText variant="labelSmall" color={colors.muted}>
            {postpaid ? 'TAGIHAN' : openDenom ? 'NOMINAL' : 'MULAI'}
          </AppText>
          <AppText
            variant="bodyMedium"
            color={colors.ink}
            style={styles.price}
            numberOfLines={1}
          >
            {postpaid
              ? 'Cek tagihan'
              : openDenom
                ? 'Bebas'
                : fromPrice !== null
                  ? formatRupiah(fromPrice)
                  : 'Lihat detail'}
          </AppText>
        </View>
        <MaterialCommunityIcons
          name="arrow-top-right"
          size={18}
          color={colors.coralDark}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: 3,
  },
  pressed: {
    opacity: 0.72,
  },
  media: {
    height: 72,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  serverBadge: {
    backgroundColor: colors.coralSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  serverText: {
    fontSize: 8,
    lineHeight: 12,
  },
  name: {
    minHeight: 42,
    lineHeight: 21,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  priceWrap: {
    flex: 1,
    gap: 1,
  },
  price: {
    fontFamily: fonts.monoMedium,
    fontSize: 13,
  },
});
