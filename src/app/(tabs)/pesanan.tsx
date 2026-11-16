import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import type { Order } from '@/api/types';
import { OrderRow } from '@/components/order/OrderRow';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { FilterChips } from '@/components/ui/Tabs';
import { TopCurvedHeader } from '@/components/ui/TopCurvedHeader';
import { useTabBackToHome } from '@/hooks/useBackHandler';
import { useOrders } from '@/hooks/useOrders';
import {
  colors,
  fonts,
  layout,
  orderStatusFilters,
  radius,
  spacing,
} from '@/theme/tokens';

export default function OrdersScreen() {
  const [status, setStatus] = useState('ALL');
  const ordersQuery = useOrders(status);

  useTabBackToHome();

  const orders = useMemo(
    () => ordersQuery.data?.pages.flatMap((page) => page?.data ?? []) ?? [],
    [ordersQuery.data],
  );

  const renderItem: ListRenderItem<Order> = ({ item }) => (
    <View style={styles.itemWrapper}>
      <OrderRow
        order={item}
        onPress={() =>
          router.push({
            pathname: '/pesanan/[id]',
            params: { id: item.id },
          })
        }
      />
    </View>
  );

  const totalCount =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ordersQuery.data?.pages[0] as any)?.meta?.total ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ordersQuery.data?.pages[0] as any)?.pagination?.total ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ordersQuery.data?.pages[0] as any)?.total ??
    orders.length;

  return (
    <Screen
      edges={['left', 'right']}
      safeStyle={{ backgroundColor: colors.coral }}
      style={styles.screenBody}
    >
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.45}
        onEndReached={() => {
          if (ordersQuery.hasNextPage && !ordersQuery.isFetchingNextPage) {
            void ordersQuery.fetchNextPage();
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={
              ordersQuery.isRefetching && !ordersQuery.isFetchingNextPage
            }
            onRefresh={() => void ordersQuery.refetch()}
            colors={[colors.coralDark]}
            tintColor={colors.coralDark}
            progressBackgroundColor={colors.surface}
          />
        }
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <TopCurvedHeader
              title="Pesanan"
              badge={`${totalCount} Pesanan`}
            />
            <View style={styles.filterSection}>
              <FilterChips
                items={orderStatusFilters}
                value={status}
                onChange={setStatus}
                style={styles.filtersScroll}
                contentContainerStyle={styles.filtersContent}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrapper}>
            {ordersQuery.isPending ? (
              <LoadingState label="Memuat pesanan…" />
            ) : ordersQuery.isError ? (
              <ErrorState
                error={ordersQuery.error}
                title="Pesanan gagal dimuat"
                onRetry={() => void ordersQuery.refetch()}
              />
            ) : (
              <EmptyState
                icon="receipt-text-outline"
                title={
                  status === 'ALL'
                    ? 'Belum ada pesanan'
                    : 'Tidak ada pesanan di filter ini'
                }
                description={
                  status === 'ALL'
                    ? 'Semua transaksi yang kamu buat akan muncul di sini.'
                    : 'Coba pilih status lain untuk melihat pesanan lainnya.'
                }
                actionLabel={status === 'ALL' ? 'Mulai belanja' : 'Lihat semua'}
                onAction={() =>
                  status === 'ALL'
                    ? router.push('/(tabs)/katalog')
                    : setStatus('ALL')
                }
              />
            )}
          </View>
        }
        ListFooterComponent={
          ordersQuery.isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator color={colors.coralDark} size="small" />
            </View>
          ) : orders.length && !ordersQuery.hasNextPage ? (
            <AppText
              variant="bodySmall"
              color={colors.muted}
              align="center"
              style={styles.footer}
            >
              Itu semua pesananmu.
            </AppText>
          ) : undefined
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
  filterSection: {
    paddingTop: spacing.sm + 4,
    paddingBottom: spacing.xs,
    backgroundColor: colors.paper,
  },
  listContent: {
    paddingBottom: 32,
    flexGrow: 1,
    backgroundColor: colors.paper,
  },
  itemWrapper: {
    paddingHorizontal: layout.screenPadding,
  },
  emptyWrapper: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
  },
  filtersScroll: {
    marginHorizontal: 0,
  },
  filtersContent: {
    paddingHorizontal: layout.screenPadding,
  },
  footer: {
    paddingVertical: spacing.lg,
    paddingHorizontal: layout.screenPadding,
    fontFamily: fonts.regular,
  },
});
