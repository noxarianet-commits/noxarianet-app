import { Pressable, StyleSheet, View } from 'react-native';

import type { Product } from '@/api/types';
import { ProductArtwork } from '@/components/product/ProductArtwork';
import { AppText } from '@/components/ui/AppText';
import { truncate } from '@/lib/format';
import { cleanProductName } from '@/lib/products';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

export function ProductCard({
  product,
  onPress,
  serverCount,
}: {
  product: Product;
  onPress: () => void;
  serverCount?: number;
}) {
  const totalServers = serverCount || product.servers?.length || 0;
  const cleanName = cleanProductName(product.name);
  const cleanCat = cleanProductName(product.category);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${cleanName}, ${cleanCat}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.iconContainer}>
        <ProductArtwork product={product} size={28} cornerRadius={6} />
      </View>

      <View style={styles.content}>
        <AppText
          variant="titleSmall"
          numberOfLines={2}
          ellipsizeMode="tail"
          style={styles.name}
        >
          {cleanName}
        </AppText>

        <View style={styles.metaRow}>
          <AppText
            variant="labelSmall"
            color={colors.muted}
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.category}
          >
            {cleanCat}
          </AppText>
          {totalServers > 1 ? (
            <View style={styles.serverBadge}>
              <AppText variant="labelSmall" style={styles.serverText}>
                {totalServers} Server
              </AppText>
            </View>
          ) : null}
        </View>
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
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  pressed: {
    opacity: 0.72,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3EEFA',
    borderWidth: 1,
    borderColor: '#E8DEF8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.coralDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    gap: 2,
  },
  name: {
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    lineHeight: 15.5,
    textAlign: 'center',
    color: colors.ink,
    minHeight: 31,
    flexShrink: 1,
    width: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 1,
    maxWidth: '100%',
  },
  category: {
    fontSize: 10,
    textAlign: 'center',
    flexShrink: 1,
  },
  serverBadge: {
    backgroundColor: colors.coralSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  serverText: {
    fontSize: 9,
    color: colors.coralDark,
    fontFamily: fonts.medium,
  },
});
