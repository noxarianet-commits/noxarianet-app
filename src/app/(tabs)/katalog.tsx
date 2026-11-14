import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  type ListRenderItem,
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
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useTabBackToHome } from '@/hooks/useBackHandler';
import { useHome } from '@/hooks/useHome';
import { useProducts, type CatalogType } from '@/hooks/useProducts';
import { mergeProductRows } from '@/lib/products';
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
  const p = productCategory.toLowerCase().trim();
  const t = targetCategory.toLowerCase().trim();
  return p === t || p.includes(t) || t.includes(p);
}

function CategorySection({
  group,
  onSeeAll,
  onProductPress,
}: {
  group: CategoryGroup;
  onSeeAll: () => void;
  onProductPress: (id: number | string) => void;
}) {
  return (
    <View style={styles.categorySection}>
      <View style={styles.categorySectionHeader}>
        <View style={styles.categoryTitleWrap}>
          <AppText variant="titleMedium" style={styles.categoryTitleText} numberOfLines={1}>
            {group.name}
          </AppText>
          <View style={styles.categoryBadge}>
            <AppText variant="labelSmall" color={colors.coralDark} style={styles.badgeText}>
              {group.products.length} PRODUK
            </AppText>
          </View>
        </View>

        <Pressable
          onPress={onSeeAll}
          accessibilityRole="button"
          accessibilityLabel={`Lihat semua ${group.name}`}
          style={({ pressed }) => [styles.seeAllBtn, pressed && styles.pressed]}
        >
          <AppText variant="labelMedium" color={colors.coralDark} style={styles.seeAllText}>
            Lihat Semua
          </AppText>
          <MaterialCommunityIcons name="chevron-right" size={16} color={colors.coralDark} />
        </Pressable>
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
  const debouncedSearch = useDebouncedValue(search, 350);
  const category = params.category || 'ALL';
  const requestedType: CatalogType =
    params.type === 'postpaid' ? 'postpaid' : 'prepaid';
  const type: CatalogType = billsEnabled ? requestedType : 'prepaid';

  const productsQuery = useProducts({
    search: debouncedSearch,
    category,
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
      ...categories.map((item) => ({ key: item.name, label: item.name })),
    ];
  }, [homeQuery.data?.bill_categories, homeQuery.data?.prepaid_categories, type]);

  const setType = (next: string) => {
    router.setParams({
      type: next === 'postpaid' && billsEnabled ? 'postpaid' : undefined,
      category: undefined,
    });
  };

  const resetFilters = () => {
    setSearch('');
    router.setParams({ category: undefined });
  };

  const displayedProducts = useMemo(() => {
    if (category === 'ALL') return products;
    return products.filter((p) => matchesCategory(p.category, category));
  }, [products, category]);

  const searchFilteredProducts = useMemo(() => {
    if (!search.trim()) return displayedProducts;
    const query = search.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query),
    );
  }, [displayedProducts, products, search]);

  const isGroupedView = category === 'ALL' && !search.trim();

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
          name: cat.name,
          products: catProducts,
        });
      }
    }

    // 2. Kategori lain yang belum terdaftar di list utama
    const remaining = products.filter((p) => !usedProductIds.has(p.id));
    if (remaining.length > 0) {
      const remainingMap = new Map<string, Product[]>();
      for (const p of remaining) {
        const cName = p.category?.trim() || 'Lainnya';
        if (!remainingMap.has(cName)) remainingMap.set(cName, []);
        remainingMap.get(cName)!.push(p);
      }
      for (const [cName, prods] of remainingMap.entries()) {
        groups.push({ name: cName, products: prods });
      }
    }

    return groups;
  }, [isGroupedView, type, homeQuery.data, products]);

  const renderItem: ListRenderItem<Product> = ({ item }) => (
    <View style={styles.gridItem}>
      <ProductCard
        product={item}
        serverCount={item.servers?.length}
        onPress={() =>
          router.push({
            pathname: '/produk/[id]',
            params: { id: String(item.id) },
          })
        }
      />
    </View>
  );

  const headerComponent = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <AppText variant="labelSmall" color={colors.coralDark}>
            {category !== 'ALL'
              ? 'KATEGORI PRODUK'
              : type === 'postpaid'
                ? 'KATALOG TAGIHAN'
                : 'KATALOG PREPAID'}
          </AppText>
          <AppText style={styles.titleText} numberOfLines={1}>
            {category !== 'ALL'
              ? category
              : type === 'postpaid'
                ? 'Bayar tagihan'
                : 'Mau top up apa?'}
          </AppText>
        </View>
        <View style={styles.countBadge}>
          <AppText variant="labelSmall" color={colors.muted}>
            {category !== 'ALL'
              ? `${displayedProducts.length} PRODUK`
              : `${
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (productsQuery.data?.pages[0] as any)?.meta?.total ??
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (productsQuery.data?.pages[0] as any)?.pagination?.total ??
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (productsQuery.data?.pages[0] as any)?.total ??
                  products.length
                } PRODUK`}
          </AppText>
        </View>
      </View>

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
        value={category}
        onChange={(key) =>
          router.setParams({ category: key === 'ALL' ? undefined : key })
        }
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      />

      {category !== 'ALL' || search ? (
        <View style={styles.resultRow}>
          <AppText variant="bodySmall" color={colors.muted}>
            {search
              ? `${searchFilteredProducts.length} hasil untuk "${search}"`
              : `${displayedProducts.length} produk di kategori ${category}`}
          </AppText>
          <AppText
            variant="labelMedium"
            color={colors.coralDark}
            onPress={resetFilters}
            accessibilityRole="button"
          >
            {category !== 'ALL' ? 'Semua Kategori' : 'Reset'}
          </AppText>
        </View>
      ) : null}
    </View>
  );

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
    <Screen edges={['top', 'left', 'right']}>
      {isGroupedView ? (
        <FlatList<CategoryGroup>
          key="grouped-catalog"
          data={groupedCategories}
          keyExtractor={(group) => group.name}
          renderItem={({ item }) => (
            <CategorySection
              group={item}
              onSeeAll={() => router.setParams({ category: item.name })}
              onProductPress={(id) =>
                router.push({
                  pathname: '/produk/[id]',
                  params: { id: String(id) },
                })
              }
            />
          )}
          numColumns={1}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
          ListHeaderComponent={headerComponent}
          ListEmptyComponent={emptyComponent}
        />
      ) : (
        <FlatList<Product>
          key="grid-catalog"
          data={searchFilteredProducts}
          keyExtractor={(item) => item.canonical_key || String(item.id)}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.45}
          onEndReached={() => {
            if (productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
              void productsQuery.fetchNextPage();
            }
          }}
          refreshControl={refreshControl}
          ListHeaderComponent={headerComponent}
          ListEmptyComponent={emptyComponent}
          ListFooterComponent={footerComponent}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 32,
    flexGrow: 1,
  },
  header: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  titleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleText: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.ink,
  },
  countBadge: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 0,
  },
  typeTabs: {
    marginBottom: spacing.md,
  },
  searchWrap: {
    marginBottom: spacing.md,
  },
  filtersScroll: {
    marginHorizontal: -layout.screenPadding,
    marginBottom: spacing.md,
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
  column: {
    gap: spacing.sm,
  },
  gridItem: {
    flex: 1,
    maxWidth: '48.5%',
    marginBottom: spacing.sm,
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
    fontSize: 17,
    lineHeight: 22,
    color: colors.ink,
  },
  categoryBadge: {
    backgroundColor: colors.coralSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  seeAllText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
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
    fontFamily: fonts.regular,
  },
});
