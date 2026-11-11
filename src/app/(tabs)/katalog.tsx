import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
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
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { FilterChips, UnderlineTabs } from '@/components/ui/Tabs';
import { TextField } from '@/components/ui/TextField';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useHome } from '@/hooks/useHome';
import { useProducts, type CatalogType } from '@/hooks/useProducts';
import { mergeProductRows } from '@/lib/products';
import { colors, fonts, layout, spacing } from '@/theme/tokens';

const TYPE_TABS = [
  { key: 'prepaid', label: 'Prepaid' },
  { key: 'postpaid', label: 'Tagihan' },
] as const;

export default function CatalogScreen() {
  const params = useLocalSearchParams<{ category?: string; type?: string }>();
  const homeQuery = useHome();
  const configQuery = useAppConfig();

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
        productsQuery.data?.pages.flatMap((page) => page.data) ?? [],
      ),
    [productsQuery.data],
  );

  const categoryItems = useMemo(() => {
    const categories =
      type === 'postpaid'
        ? (homeQuery.data?.bill_categories ?? [])
        : (homeQuery.data?.prepaid_categories ?? []);
    return [
      { key: 'ALL', label: 'Semua' },
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

  return (
    <Screen edges={['top', 'left', 'right']}>
      <FlatList
        data={products}
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
        refreshControl={
          <RefreshControl
            refreshing={
              productsQuery.isRefetching && !productsQuery.isFetchingNextPage
            }
            onRefresh={() => void productsQuery.refetch()}
            colors={[colors.coralDark]}
            tintColor={colors.coralDark}
            progressBackgroundColor={colors.surface}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.titleCopy}>
                <AppText variant="labelSmall" color={colors.coralDark}>
                  {type === 'postpaid'
                    ? 'KATALOG TAGIHAN'
                    : 'KATALOG PREPAID'}
                </AppText>
                <AppText variant="headlineLarge">
                  {type === 'postpaid' ? 'Bayar tagihan' : 'Mau top up apa?'}
                </AppText>
              </View>
              <View style={styles.countBadge}>
                <AppText variant="labelSmall" color={colors.muted}>
                  {productsQuery.data?.pages[0]?.meta.total ?? 0} PRODUK
                </AppText>
              </View>
            </View>

            <UnderlineTabs
              items={billsEnabled ? TYPE_TABS : TYPE_TABS.slice(0, 1)}
              value={type}
              onChange={setType}
              style={styles.typeTabs}
            />

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

            <FilterChips
              items={categoryItems}
              value={category}
              onChange={(key) =>
                router.setParams({ category: key === 'ALL' ? undefined : key })
              }
              style={styles.filters}
            />

            {products.length ? (
              <View style={styles.resultRow}>
                <AppText variant="bodySmall" color={colors.muted}>
                  {products.length} produk ditampilkan
                </AppText>
                {category !== 'ALL' || search ? (
                  <AppText
                    variant="labelMedium"
                    color={colors.coralDark}
                    onPress={resetFilters}
                    accessibilityRole="button"
                  >
                    Reset
                  </AppText>
                ) : null}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          productsQuery.isPending ? (
            <LoadingState label="Memuat katalog…" />
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
          )
        }
        ListFooterComponent={
          productsQuery.isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator color={colors.coralDark} size="small" />
            </View>
          ) : products.length && !productsQuery.hasNextPage ? (
            <AppText
              variant="bodySmall"
              color={colors.muted}
              align="center"
              style={styles.footer}
            >
              Semua produk sudah ditampilkan.
            </AppText>
          ) : undefined
        }
      />
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.base,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  titleCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  countBadge: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 4,
  },
  typeTabs: {
    marginTop: -spacing.xs,
    gap: 20,
  },
  filters: {
    marginTop: -spacing.xs,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: -spacing.xs,
  },
  column: {
    gap: spacing.sm,
  },
  gridItem: {
    flex: 1,
    maxWidth: '48.5%',
    marginBottom: spacing.sm,
  },
  footer: {
    paddingVertical: spacing.lg,
    fontFamily: fonts.regular,
  },
});
