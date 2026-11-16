import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { ActivityIndicator, TextInput } from 'react-native-paper';

import type { Product } from '@/api/types';
import { ProductCard } from '@/components/product/ProductCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { CatalogGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { FilterChips, UnderlineTabs } from '@/components/ui/Tabs';
import { TextField } from '@/components/ui/TextField';
import { TopCurvedHeader } from '@/components/ui/TopCurvedHeader';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useTabBackToHome } from '@/hooks/useBackHandler';
import { useHome } from '@/hooks/useHome';
import { useProducts, type CatalogType } from '@/hooks/useProducts';
import { cleanProductName, mergeProductRows } from '@/lib/products';
import { colors, fonts, layout, radius, spacing } from '@/theme/tokens';

const TYPE_TABS = [
  { key: 'prepaid', label: 'Prepaid' },
  { key: 'postpaid', label: 'Tagihan' },
] as const;

type CategoryGroup = {
  name: string;
  products: Product[];
};

function matchesCategory(
  productCategory?: string | null,
  targetCategory?: string | null,
) {
  if (!productCategory || !targetCategory) return false;
  const p = cleanProductName(productCategory).toLowerCase().trim();
  const t = cleanProductName(targetCategory).toLowerCase().trim();
  return p === t || p.includes(t) || t.includes(p);
}

function CategorySection({
  group,
  onProductPress,
}: {
  group: CategoryGroup;
  onProductPress: (id: number | string) => void;
}) {
  const cleanGroupName = cleanProductName(group.name);

  return (
    <View style={styles.categorySection}>
      <View style={styles.categorySectionHeader}>
        <View style={styles.categoryTitleWrap}>
          <AppText
            variant="titleMedium"
            style={styles.categoryTitleText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.82}
          >
            {cleanGroupName}
          </AppText>
          <View style={styles.categoryBadge}>
            <AppText variant="labelSmall" color={colors.coralDark} style={styles.badgeText} numberOfLines={1}>
              {group.products.length} PRODUK
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.groupGrid}>
        {group.products.map((item) => (
          <View key={`${item.vendor}-${item.id}`} style={styles.groupGridItem}>
            <ProductCard
              product={item}
              serverCount={item.servers?.length}
              onPress={() => onProductPress(item.id)}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function CatalogScreen() {
  const params = useLocalSearchParams<{ category?: string; type?: string }>();
  const homeQuery = useHome();
  const configQuery = useAppConfig();

  useTabBackToHome();

  const billsEnabled = configQuery.data?.features?.bills !== false;

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 200);
  const [selectedCategory, setSelectedCategory] = useState<string>(params.category || 'ALL');

  useEffect(() => {
    if (params.category && params.category !== selectedCategory) {
      setSelectedCategory(params.category);
    }
  }, [params.category]);

  const requestedType: CatalogType =
    params.type === 'postpaid' ? 'postpaid' : 'prepaid';
  const type: CatalogType = billsEnabled ? requestedType : 'prepaid';

  // Mengambil katalog produk lengkap untuk tipe ini (prepaid / postpaid)
  // Query key stabil berdasarkan type agar TanStack Query TIDAK fetch ulang saat user mengetik search (0 ms in-memory search!)
  const productsQuery = useProducts({
    type,
  });

  const products = useMemo(
    () =>
      mergeProductRows(
        productsQuery.data?.pages.flatMap((page) => page?.data ?? []) ?? [],
      ),
    [productsQuery.data],
  );

  const categoryItems = useMemo(() => {
    const categories =
      type === 'postpaid'
        ? (homeQuery.data?.bill_categories ?? [])
        : (homeQuery.data?.prepaid_categories ?? []);
    return [
      { key: 'ALL', label: 'Semua Kategori' },
      ...categories.map((item) => {
        const clean = cleanProductName(item.name);
        return { key: clean, label: clean };
      }),
    ];
  }, [homeQuery.data?.bill_categories, homeQuery.data?.prepaid_categories, type]);

  const setType = (next: string) => {
    setSelectedCategory('ALL');
    router.setParams({
      type: next === 'postpaid' && billsEnabled ? 'postpaid' : undefined,
      category: undefined,
    });
  };

  const handleSelectCategory = (key: string) => {
    setSelectedCategory(key);
    router.setParams({ category: key === 'ALL' ? undefined : key });
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('ALL');
    router.setParams({ category: undefined });
  };

  const displayedProducts = useMemo(() => {
    if (selectedCategory === 'ALL') return products;
    return products.filter((p) => matchesCategory(p.category, selectedCategory));
  }, [products, selectedCategory]);

  const searchFilteredProducts = useMemo(() => {
    if (!debouncedSearch.trim()) return displayedProducts;
    const query = debouncedSearch.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query),
    );
  }, [displayedProducts, products, debouncedSearch]);

  const isGroupedView = selectedCategory === 'ALL' && !debouncedSearch.trim();

  const groupedCategories = useMemo(() => {
    if (!isGroupedView) return [];

    const list =
      type === 'postpaid'
        ? (homeQuery.data?.bill_categories ?? [])
        : (homeQuery.data?.prepaid_categories ?? []);

    const groups: CategoryGroup[] = [];
    const usedProductIds = new Set<number>();

    // 1. Kelompokkan produk sesuai urutan kategori toko
    for (const cat of list) {
      const catProducts = products.filter((p) => {
        if (usedProductIds.has(p.id)) return false;
        if (matchesCategory(p.category, cat.name)) {
          usedProductIds.add(p.id);
          return true;
        }
        return false;
      });

      if (catProducts.length > 0) {
        groups.push({
          name: cleanProductName(cat.name),
          products: catProducts,
        });
      }
    }

    // 2. Kategori lain yang belum terdaftar di list utama
    const remaining = products.filter((p) => !usedProductIds.has(p.id));
    if (remaining.length > 0) {
      const remainingMap = new Map<string, Product[]>();
      for (const p of remaining) {
        const cName = cleanProductName(p.category?.trim() || 'Lainnya');
        if (!remainingMap.has(cName)) remainingMap.set(cName, []);
        remainingMap.get(cName)!.push(p);
      }
      for (const [cName, prods] of remainingMap.entries()) {
        groups.push({ name: cName, products: prods });
      }
    }

    return groups;
  }, [isGroupedView, type, homeQuery.data, products]);

  const productPairs = useMemo(() => {
    const pairs: Product[][] = [];
    for (let i = 0; i < searchFilteredProducts.length; i += 2) {
      pairs.push(searchFilteredProducts.slice(i, i + 2));
    }
    return pairs;
  }, [searchFilteredProducts]);

  const listData = isGroupedView ? groupedCategories : productPairs;

  const renderItem = ({ item }: { item: CategoryGroup | Product[] }) => {
    if (isGroupedView) {
      return (
        <View style={styles.groupWrapper}>
          <CategorySection
            group={item as CategoryGroup}
            onProductPress={(id) =>
              router.push({
                pathname: '/produk/[id]',
                params: { id: String(id) },
              })
            }
          />
        </View>
      );
    }

    const pair = item as Product[];
    return (
      <View style={styles.gridRow}>
        {pair.map((product) => (
          <View key={`${product.vendor}-${product.id}`} style={styles.gridItem}>
            <ProductCard
              product={product}
              serverCount={product.servers?.length}
              onPress={() =>
                router.push({
                  pathname: '/produk/[id]',
                  params: { id: String(product.id) },
                })
              }
            />
          </View>
        ))}
      </View>
    );
  };

  const keyExtractor = (item: CategoryGroup | Product[]) => {
    if (isGroupedView) {
      return (item as CategoryGroup).name;
    }
    const pair = item as Product[];
    return pair.map((p) => p.canonical_key || `${p.vendor}-${p.id}`).join('_');
  };

  const totalCatalogCount = `${
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (productsQuery.data?.pages[0] as any)?.meta?.total ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (productsQuery.data?.pages[0] as any)?.pagination?.total ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (productsQuery.data?.pages[0] as any)?.total ??
    products.length
  } Produk`;

  const emptyComponent = productsQuery.isPending ? (
    <CatalogGridSkeleton />
  ) : productsQuery.isError ? (
    <ErrorState
      error={productsQuery.error}
      title="Katalog gagal dimuat"
      onRetry={() => void productsQuery.refetch()}
    />
  ) : (
    <EmptyState
      icon="magnify-close"
      title="Produk tidak ditemukan"
      description="Coba kata kunci lain atau pilih kategori yang berbeda."
      actionLabel="Reset filter"
      onAction={resetFilters}
    />
  );

  const footerComponent = productsQuery.isFetchingNextPage ? (
    <View style={styles.footer}>
      <ActivityIndicator color={colors.coralDark} size="small" />
    </View>
  ) : displayedProducts.length && !productsQuery.hasNextPage ? (
    <AppText
      variant="bodySmall"
      color={colors.muted}
      align="center"
      style={styles.footer}
    >
      Semua produk sudah ditampilkan.
    </AppText>
  ) : undefined;

  const refreshControl = (
    <RefreshControl
      refreshing={productsQuery.isRefetching && !productsQuery.isFetchingNextPage}
      onRefresh={() => void productsQuery.refetch()}
      colors={[colors.coralDark]}
      tintColor={colors.coralDark}
      progressBackgroundColor={colors.surface}
    />
  );

  return (
    <Screen
      edges={['left', 'right']}
      safeStyle={{ backgroundColor: colors.coral }}
      style={styles.screenBody}
    >
      <FlatList
        key="catalog-list"
        data={listData as any}
        keyExtractor={keyExtractor as any}
        renderItem={renderItem as any}
        numColumns={1}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.45}
        onEndReached={() => {
          if (!isGroupedView && productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
            void productsQuery.fetchNextPage();
          }
        }}
        refreshControl={refreshControl}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <TopCurvedHeader
              title={selectedCategory !== 'ALL' ? selectedCategory : 'Katalog'}
              badge={selectedCategory !== 'ALL' ? `${displayedProducts.length} Produk` : totalCatalogCount}
            />

            <View style={styles.fixedHeader}>
              <UnderlineTabs
                items={billsEnabled ? TYPE_TABS : TYPE_TABS.slice(0, 1)}
                value={type}
                onChange={setType}
                style={styles.typeTabs}
              />

              <View style={styles.searchWrap}>
                <TextField
                  placeholder={
                    type === 'postpaid'
                      ? 'Cari listrik, air, BPJS, pajak…'
                      : 'Cari game, pulsa, e-wallet…'
                  }
                  value={search}
                  onChangeText={setSearch}
                  autoCorrect={false}
                  autoCapitalize="none"
                  returnKeyType="search"
                  left={<TextInput.Icon icon="magnify" color={colors.muted} />}
                  right={
                    search ? (
                      <TextInput.Icon
                        icon="close-circle"
                        color={colors.muted}
                        forceTextInputFocus={false}
                        onPress={() => setSearch('')}
                        accessibilityLabel="Hapus pencarian"
                      />
                    ) : undefined
                  }
                />
              </View>

              <FilterChips
                items={categoryItems}
                value={selectedCategory}
                onChange={handleSelectCategory}
                style={styles.filtersScroll}
                contentContainerStyle={styles.filtersContent}
              />

              {selectedCategory !== 'ALL' || search ? (
                <View style={styles.resultRow}>
                  <AppText variant="bodySmall" color={colors.muted}>
                    {search
                      ? `${searchFilteredProducts.length} hasil untuk "${search}"`
                      : `${displayedProducts.length} produk di kategori ${selectedCategory}`}
                  </AppText>
                  <AppText
                    variant="labelMedium"
                    color={colors.coralDark}
                    onPress={resetFilters}
                    accessibilityRole="button"
                  >
                    {selectedCategory !== 'ALL' ? 'Semua Kategori' : 'Reset'}
                  </AppText>
                </View>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrapper}>
            {emptyComponent}
          </View>
        }
        ListFooterComponent={
          !isGroupedView ? footerComponent : undefined
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenBody: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  headerBlock: {
    backgroundColor: colors.paper,
    marginBottom: spacing.xs,
  },
  fixedHeader: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: 2,
    backgroundColor: colors.paper,
  },
  listContent: {
    paddingBottom: 32,
    flexGrow: 1,
    backgroundColor: colors.paper,
  },
  groupWrapper: {
    paddingHorizontal: layout.screenPadding,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    marginBottom: spacing.sm,
  },
  gridItem: {
    width: '48.5%',
  },
  emptyWrapper: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
  },
  typeTabs: {
    marginBottom: spacing.sm,
  },
  searchWrap: {
    marginBottom: spacing.sm,
  },
  filtersScroll: {
    marginHorizontal: -layout.screenPadding,
    marginBottom: spacing.sm,
  },
  filtersContent: {
    paddingHorizontal: layout.screenPadding,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  categorySection: {
    marginBottom: spacing.lg,
  },
  categorySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: 1,
  },
  categoryTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  categoryTitleText: {
    fontFamily: fonts.bold,
    fontSize: 15.5,
    lineHeight: 21,
    color: colors.ink,
    flexShrink: 1,
  },
  categoryBadge: {
    backgroundColor: colors.coralSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    flexShrink: 0,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  groupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
  },
  groupGridItem: {
    width: '48.5%',
  },
  footer: {
    paddingVertical: spacing.lg,
    paddingHorizontal: layout.screenPadding,
    fontFamily: fonts.regular,
  },
});
