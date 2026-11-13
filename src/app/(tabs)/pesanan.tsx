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
import { useTabBackToHome } from '@/hooks/useBackHandler';
import { useOrders } from '@/hooks/useOrders';
import {
  colors,
  fonts,
  layout,
  orderStatusFilters,
  spacing,
} from '@/theme/tokens';

export default function OrdersScreen() {
  const [status, setStatus] = useState('ALL');
  const ordersQuery = useOrders(status);

  useTabBackToHome();

  const orders = useMemo(
    () => ordersQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [ordersQuery.data],
  );

  const renderItem: ListRenderItem<Order> = ({ item }) => (
    <OrderRow
      order={item}
      onPress={() =>
        router.push({
          pathname: '/pesanan/[id]',
          params: { id: item.id },
        })
      }
    />
  );

  return (
    <Screen edges={['top', 'left', 'right']}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
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
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.titleCopy}>
                <AppText variant="labelSmall" color={colors.coralDark}>
                  RIWAYAT TRANSAKSI
                </AppText>
                <AppText variant="headlineLarge">Pesanan kamu</AppText>
              </View>
              <AppText variant="labelSmall" color={colors.muted} style={styles.totalBadge}>
                {ordersQuery.data?.pages[0]?.meta.total ?? 0} TOTAL
              </AppText>
            </View>

            <AppText variant="bodyMedium" color={colors.muted}>
              Pantau status top up dan pembelian digitalmu di sini.
            </AppText>

            <FilterChips
              items={orderStatusFilters}
              value={status}
              onChange={setStatus}
              style={styles.filtersScroll}
              contentContainerStyle={styles.filtersContent}
            />
          </View>
        }
        ListEmptyComponent={
          ordersQuery.isPending ? (
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
          )
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
  list: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 32,
    flexGrow: 1,
  },
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
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
    minWidth: 0,
    gap: spacing.xs,
  },
  totalBadge: {
    flexShrink: 0,
  },
  filtersScroll: {
    marginHorizontal: -layout.screenPadding,
  },
  filtersContent: {
    paddingHorizontal: layout.screenPadding,
  },
  footer: {
    paddingVertical: spacing.lg,
    fontFamily: fonts.regular,
  },
});
