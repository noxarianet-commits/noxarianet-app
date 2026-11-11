import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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

import type { BalanceTransaction } from '@/api/types';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { FilterChips } from '@/components/ui/Tabs';
import { useBalance } from '@/hooks/useBalance';
import { useBalanceHistory } from '@/hooks/useBalanceHistory';
import { formatDate, formatRupiah } from '@/lib/format';
import { colors, fonts, layout, spacing } from '@/theme/tokens';

const FILTERS = [
  { key: 'ALL', label: 'Semua' },
  { key: 'topup', label: 'Top up' },
  { key: 'purchase', label: 'Pembelian' },
  { key: 'refund', label: 'Refund' },
] as const;

const TYPE_META: Record<
  string,
  {
    label: string;
    icon: 'wallet-plus-outline' | 'shopping-outline' | 'cash-refund' | 'swap-horizontal';
    direction: 'in' | 'out';
  }
> = {
  topup: { label: 'Top up saldo', icon: 'wallet-plus-outline', direction: 'in' },
  purchase: { label: 'Pembelian', icon: 'shopping-outline', direction: 'out' },
  refund: { label: 'Refund', icon: 'cash-refund', direction: 'in' },
};

export default function BalanceHistoryScreen() {
  const [type, setType] = useState('ALL');
  const balanceQuery = useBalance();
  const historyQuery = useBalanceHistory(type);

  const items = useMemo(
    () => historyQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [historyQuery.data],
  );

  const renderItem: ListRenderItem<BalanceTransaction> = ({ item }) => {
    const meta = TYPE_META[item.type || ''] || {
      label: item.description || 'Transaksi saldo',
      icon: 'swap-horizontal' as const,
      direction: 'in' as const,
    };
    const isPending = item.status && item.status !== 'completed';
    const signed =
      meta.direction === 'in'
        ? `+ ${formatRupiah(Math.abs(item.amount))}`
        : `- ${formatRupiah(Math.abs(item.amount))}`;

    return (
      <View style={styles.row}>
        <View
          style={[
            styles.rowIcon,
            meta.direction === 'in' ? styles.iconIn : styles.iconOut,
          ]}
        >
          <MaterialCommunityIcons
            name={meta.icon}
            size={20}
            color={
              meta.direction === 'in' ? colors.teal : colors.coralDark
            }
          />
        </View>

        <View style={styles.rowCopy}>
          <AppText variant="titleSmall" numberOfLines={1}>
            {item.description || meta.label}
          </AppText>
          <AppText variant="bodySmall" color={colors.muted} numberOfLines={1}>
            {formatDate(item.created_at || item.credited_at)}
            {item.reference_id ? ` · ${item.reference_id}` : ''}
          </AppText>
          {isPending ? (
            <AppText variant="labelSmall" color={colors.goldInk}>
              {String(item.status).toUpperCase()}
            </AppText>
          ) : typeof item.balance_after === 'number' ? (
            <AppText variant="labelSmall" color={colors.muted}>
              Saldo akhir {formatRupiah(item.balance_after)}
            </AppText>
          ) : null}
        </View>

        <AppText
          variant="bodyMedium"
          color={meta.direction === 'in' ? colors.teal : colors.ink}
          style={styles.amount}
        >
          {signed}
        </AppText>
      </View>
    );
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id || item.reference_id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.45}
        onEndReached={() => {
          if (historyQuery.hasNextPage && !historyQuery.isFetchingNextPage) {
            void historyQuery.fetchNextPage();
          }
        }}
        refreshControl={
          <RefreshControl
            refreshing={
              historyQuery.isRefetching && !historyQuery.isFetchingNextPage
            }
            onRefresh={() => {
              void historyQuery.refetch();
              void balanceQuery.refetch();
            }}
            colors={[colors.coralDark]}
            tintColor={colors.coralDark}
            progressBackgroundColor={colors.surface}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="labelSmall" color={colors.coralDark}>
              MUTASI SALDO
            </AppText>
            <AppText variant="headlineLarge">Riwayat saldo</AppText>
            <View style={styles.balanceBox}>
              <View>
                <AppText variant="labelSmall" color={colors.muted}>
                  SALDO SAAT INI
                </AppText>
                <AppText style={styles.balanceValue}>
                  {formatRupiah(balanceQuery.data?.balance ?? 0)}
                </AppText>
              </View>
              <AppText variant="bodySmall" color={colors.muted} align="right">
                Batas saldo{'\n'}
                {formatRupiah(balanceQuery.data?.balance_limit ?? 0)}
              </AppText>
            </View>

            <FilterChips items={FILTERS} value={type} onChange={setType} />
          </View>
        }
        ListEmptyComponent={
          historyQuery.isPending ? (
            <LoadingState label="Memuat riwayat…" />
          ) : historyQuery.isError ? (
            <ErrorState
              error={historyQuery.error}
              title="Riwayat gagal dimuat"
              onRetry={() => void historyQuery.refetch()}
            />
          ) : (
            <EmptyState
              icon="history"
              title="Belum ada transaksi"
              description="Top up saldo atau beli produk untuk melihat mutasi di sini."
              actionLabel="Top up saldo"
              onAction={() => router.push('/topup')}
            />
          )
        }
        ListFooterComponent={
          historyQuery.isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator color={colors.coralDark} size="small" />
            </View>
          ) : items.length && !historyQuery.hasNextPage ? (
            <AppText
              variant="bodySmall"
              color={colors.muted}
              align="center"
              style={styles.footer}
            >
              Semua mutasi sudah ditampilkan.
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
  balanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    padding: spacing.base,
  },
  balanceValue: {
    fontFamily: fonts.monoMedium,
    fontSize: 26,
    lineHeight: 34,
    color: colors.ink,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconIn: {
    backgroundColor: colors.tealSoft,
  },
  iconOut: {
    backgroundColor: colors.coralSoft,
  },
  rowCopy: {
    flex: 1,
    gap: 1,
  },
  amount: {
    fontFamily: fonts.monoMedium,
    fontSize: 13,
    textAlign: 'right',
  },
  footer: {
    paddingVertical: spacing.lg,
    fontFamily: fonts.regular,
  },
});
