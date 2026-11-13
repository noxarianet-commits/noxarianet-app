import { useEffect, useState } from 'react';
import {
  Animated,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { Screen } from '@/components/ui/Screen';
import { colors, layout, radius, spacing } from '@/theme/tokens';

export function Skeleton({
  width,
  height,
  borderRadius = radius.sm,
  style,
}: {
  width?: number | `${number}%` | 'auto';
  height?: number | `${number}%`;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [opacity] = useState(() => new Animated.Value(0.35));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeletonBase,
        {
          width: width ?? '100%',
          height: height ?? 16,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton khusus saat halaman Detail Produk sedang memuat
 */
export function ProductDetailSkeleton() {
  return (
    <Screen edges={['top', 'left', 'right']}>
      <AppHeader title="Detail produk" />

      <View style={styles.detailContainer}>
        {/* Product Hero Info */}
        <View style={styles.heroBox}>
          <Skeleton width={68} height={68} borderRadius={radius.md} />
          <View style={styles.heroText}>
            <Skeleton width="40%" height={12} borderRadius={4} />
            <Skeleton width="85%" height={22} borderRadius={6} style={styles.mt6} />
            <Skeleton width="60%" height={14} borderRadius={4} style={styles.mt6} />
          </View>
        </View>

        {/* Server Selection Pills */}
        <View style={styles.pillsRow}>
          <Skeleton width={90} height={36} borderRadius={radius.pill} />
          <Skeleton width={110} height={36} borderRadius={radius.pill} />
          <Skeleton width={80} height={36} borderRadius={radius.pill} />
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Skeleton width="45%" height={18} borderRadius={4} />
          <Skeleton width="25%" height={12} borderRadius={4} />
        </View>

        {/* Variants List / Grid */}
        <View style={styles.variantsGrid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <View key={index} style={styles.variantCard}>
              <View style={styles.variantTop}>
                <Skeleton width="70%" height={15} borderRadius={4} />
                <Skeleton width={18} height={18} borderRadius={9} />
              </View>
              <Skeleton width="50%" height={16} borderRadius={4} style={styles.mt8} />
            </View>
          ))}
        </View>

        {/* Bottom Button Skeleton */}
        <View style={styles.bottomBar}>
          <Skeleton width="100%" height={48} borderRadius={radius.md} />
        </View>
      </View>
    </Screen>
  );
}

/**
 * Skeleton untuk Grid Katalog Produk
 */
export function CatalogGridSkeleton() {
  return (
    <View style={styles.catalogGrid}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={styles.catalogItem}>
          <Skeleton width="100%" height={56} borderRadius={radius.sm} />
          <Skeleton width="40%" height={10} borderRadius={3} style={styles.mt8} />
          <Skeleton width="85%" height={14} borderRadius={4} style={styles.mt6} />
          <Skeleton width="60%" height={11} borderRadius={3} style={styles.mt4} />
          <Skeleton width="50%" height={14} borderRadius={4} style={styles.mt8} />
        </View>
      ))}
    </View>
  );
}

/**
 * Skeleton untuk Halaman Beranda (Home)
 */
export function HomeSkeleton() {
  return (
    <View style={styles.homeContainer}>
      {/* Top Bar */}
      <View style={styles.homeTopBar}>
        <View style={styles.homeTopBarLeft}>
          <Skeleton width={32} height={32} borderRadius={radius.sm} />
          <View style={styles.homeBrand}>
            <Skeleton width={115} height={18} borderRadius={4} />
          </View>
        </View>
        <View style={styles.homeTopBarRight}>
          <Skeleton width={32} height={32} borderRadius={16} />
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
      </View>

      {/* Greeting */}
      <View style={styles.homeGreeting}>
        <Skeleton width="45%" height={24} borderRadius={6} />
      </View>

      {/* Card Saldo ATM Skeleton */}
      <View style={styles.homeCard}>
        <View style={styles.homeCardTop}>
          <Skeleton width={100} height={14} borderRadius={4} />
          <Skeleton width={70} height={18} borderRadius={radius.pill} />
        </View>
        <Skeleton width="50%" height={24} borderRadius={6} style={styles.mt8} />
        <Skeleton width="35%" height={12} borderRadius={4} style={styles.mt4} />
        <View style={styles.homeCardButtons}>
          <Skeleton width="48.5%" height={40} borderRadius={radius.md} />
          <Skeleton width="48.5%" height={40} borderRadius={radius.md} />
        </View>
      </View>

      {/* Categories Row */}
      <View style={styles.categoryRow}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.categoryBox}>
            <Skeleton width={38} height={38} borderRadius={19} />
            <Skeleton width="70%" height={12} borderRadius={3} style={styles.mt6} />
            <Skeleton width="45%" height={9} borderRadius={2} style={styles.mt4} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: '#E4DFEE',
  },
  mt4: {
    marginTop: 4,
  },
  mt6: {
    marginTop: 6,
  },
  mt8: {
    marginTop: 8,
  },

  // Detail Skeleton
  detailContainer: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.xs,
  },
  heroBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.md,
  },
  heroText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  variantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  variantCard: {
    width: '48.5%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.xs,
  },
  variantTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomBar: {
    marginTop: 'auto',
    paddingVertical: spacing.base,
  },

  // Catalog Skeleton
  catalogGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  catalogItem: {
    width: '48.5%',
    backgroundColor: colors.surface,
    padding: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.sm,
  },

  // Home Skeleton
  homeContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.base + 2,
  },
  homeTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  homeTopBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  homeTopBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  homeBrand: {
    gap: 2,
  },
  homeGreeting: {
    marginBottom: spacing.base,
  },
  homeCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.base,
  },
  homeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  homeCardButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.base,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  categoryBox: {
    width: 92,
    minHeight: 110,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.sm,
    alignItems: 'center',
  },
});
