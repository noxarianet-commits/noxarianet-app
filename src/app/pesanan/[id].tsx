import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { cancelOrder, getOrder } from '@/api/mobile';
import { queryKeys } from '@/api/queryKeys';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton, SecondaryButton, TextButton } from '@/components/ui/Buttons';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InfoBanner } from '@/components/ui/InfoBanner';
import { ReceiptRow } from '@/components/ui/ReceiptRow';
import { ScreenScroll } from '@/components/ui/Screen';
import { StatusPill } from '@/components/ui/StatusPill';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { getErrorMessage } from '@/lib/errors';
import { formatDateTime, formatLongDate, formatRupiah } from '@/lib/format';
import { colors, isFinalOrderStatus, spacing } from '@/theme/tokens';

const STATUS_MESSAGES: Record<string, { tone: 'info' | 'warning' | 'danger' | 'success'; title: string; message: string }> = {
  PENDING: {
    tone: 'warning',
    title: 'Menunggu pembayaran',
    message: 'Selesaikan pembayaran sebelum waktu habis agar pesanan dapat diproses.',
  },
  PROCESSING_LOCK: {
    tone: 'info',
    title: 'Pesanan sudah masuk',
    message: 'Pesanan sedang dikirim ke penyedia. Biasanya selesai dalam beberapa menit.',
  },
  PROCESSING: {
    tone: 'info',
    title: 'Sedang diproses',
    message: 'Pesanan sedang dikerjakan otomatis oleh penyedia. Halaman ini diperbarui berkala.',
  },
  COMPLETED: {
    tone: 'success',
    title: 'Pesanan selesai',
    message: 'Transaksi berhasil. Simpan bukti dan nomor seri jika diperlukan.',
  },
  FAILED: {
    tone: 'danger',
    title: 'Pesanan gagal',
    message: 'Pesanan tidak dapat diproses. Hubungi CS jika saldo sudah terpotong.',
  },
  CANCELLED: {
    tone: 'danger',
    title: 'Pesanan dibatalkan',
    message: 'Pesanan ini sudah dibatalkan dan tidak akan diproses.',
  },
  REFUND_PENDING: {
    tone: 'warning',
    title: 'Refund sedang diproses',
    message: 'Saldo akan dikembalikan ke akunmu setelah proses refund selesai.',
  },
  REFUNDED: {
    tone: 'success',
    title: 'Dana dikembalikan',
    message: 'Saldo untuk pesanan ini sudah dikembalikan.',
  },
};

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const orderId = params.id || '';
  const queryClient = useQueryClient();

  const [cancelVisible, setCancelVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const orderQuery = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => getOrder(orderId),
    select: (response) => response.data,
    enabled: !!orderId,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (status && isFinalOrderStatus(status)) return false;
      return 20000;
    },
  });

  const order = orderQuery.data;
  const status = order?.status;
  const details = order?.account_details || {};
  const statusInfo = status ? STATUS_MESSAGES[status] : undefined;
  const isPostpaid = order?.order_type === 'postpaid' || details.type === 'postpaid';
  const paidWithBalance = order?.payment_type === 'balance';
  // Order tagihan lunas dari saldo: PENDING berarti vendor masih memproses,
  // bukan "menunggu pembayaran".
  const awaitingPayment = status === 'PENDING' && !paidWithBalance;
  const target =
    details.customer_number ||
    details.customer_id ||
    details.user_id ||
    details.target ||
    details.note;
  const serial = details.sn || details.serial_number;
  const licenses = Array.isArray(details.licenses) ? details.licenses : [];

  useEffect(() => {
    if (status && isFinalOrderStatus(status)) {
      void queryClient.invalidateQueries({ queryKey: ['balance'] });
      void queryClient.invalidateQueries({ queryKey: ['balance-history'] });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  }, [queryClient, status]);

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelOrder(orderId);
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['balance'] });
      await queryClient.invalidateQueries({ queryKey: ['balance-history'] });
      await orderQuery.refetch();
      setCancelVisible(false);
    } catch (error) {
      setCancelError(getErrorMessage(error));
    } finally {
      setCancelling(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      await queryClient.fetchQuery({
        queryKey: queryKeys.order(orderId),
        queryFn: () => getOrder(orderId, true),
        staleTime: 0,
      });
    } catch (error) {
      setRefreshError(getErrorMessage(error));
    } finally {
      setRefreshing(false);
    }
  };

  const copyOrderId = async () => {
    await Clipboard.setStringAsync(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (!orderId) {
    return (
      <ScreenScroll>
        <AppHeader title="Detail pesanan" />
        <ErrorState
          error={new Error('Nomor pesanan tidak ditemukan.')}
          title="Pesanan tidak valid"
          onRetry={() => router.replace('/(tabs)/pesanan')}
          retryLabel="Ke riwayat pesanan"
        />
      </ScreenScroll>
    );
  }

  if (orderQuery.isPending) {
    return (
      <ScreenScroll>
        <AppHeader title="Detail pesanan" subtitle={orderId} />
        <LoadingState label="Memuat pesanan…" />
      </ScreenScroll>
    );
  }

  if (!order) {
    return (
      <ScreenScroll>
        <AppHeader title="Detail pesanan" subtitle={orderId} />
        <ErrorState
          error={orderQuery.error}
          title="Pesanan tidak ditemukan"
          onRetry={() => void orderQuery.refetch()}
        />
      </ScreenScroll>
    );
  }

  return (
    <>
      <ScreenScroll
        refreshing={orderQuery.isRefetching && !refreshing}
        onRefresh={() => void orderQuery.refetch()}
      >
        <AppHeader
          title="Detail pesanan"
          subtitle={formatLongDate(order.timestamp)}
          right={
            <TextButton
              compact
              onPress={() => void copyOrderId()}
              icon="content-copy"
            >
              {copied ? 'Disalin' : 'Salin'}
            </TextButton>
          }
        />

        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <StatusPill status={status} />
            <AppText variant="labelSmall" color={colors.muted}>
              {formatDateTime(order.timestamp)}
            </AppText>
          </View>
          <AppText variant="headlineMedium" numberOfLines={2}>
            {order.product}
          </AppText>
          <AppText variant="bodyMedium" color={colors.muted}>
            {order.variant}
          </AppText>
        </View>

        {statusInfo ? (
          <InfoBanner
            tone={statusInfo.tone}
            title={
              paidWithBalance && status === 'PENDING'
                ? 'Sedang diproses'
                : statusInfo.title
            }
            message={
              paidWithBalance && status === 'PENDING'
                ? 'Saldo sudah dipotong. Vendor sedang memproses tagihanmu, halaman ini diperbarui berkala.'
                : order.error_message || statusInfo.message
            }
          />
        ) : null}

        {refreshError ? (
          <InfoBanner
            tone="warning"
            title="Status belum terbarui"
            message={refreshError}
            style={styles.banner}
          />
        ) : null}

        {awaitingPayment ? (
          <View style={styles.pendingActions}>
            <PrimaryButton
              onPress={() =>
                router.push({
                  pathname: '/pembayaran/[orderId]',
                  params: { orderId },
                })
              }
              icon="qrcode-scan"
            >
              Lanjutkan pembayaran
            </PrimaryButton>
            <SecondaryButton
              onPress={() => {
                setCancelError(null);
                setCancelVisible(true);
              }}
            >
              Batalkan pesanan
            </SecondaryButton>
          </View>
        ) : null}

        <SurfaceCard style={styles.card}>
          <AppText variant="labelSmall" color={colors.muted} style={styles.eyebrow}>
            RINCIAN TRANSAKSI
          </AppText>
          <ReceiptRow label="Nomor pesanan" value={order.id} mono />
          <ReceiptRow
            label="Metode bayar"
            value={order.payment_type !== 'balance' ? 'QRIS' : 'Saldo'}
          />
          <ReceiptRow label="Harga" value={formatRupiah(order.price)} />
          {order.pg_total && order.pg_total !== order.price ? (
            <ReceiptRow label="Total bayar" value={formatRupiah(order.pg_total)} />
          ) : null}
          {order.pg_paid_at ? (
            <ReceiptRow label="Dibayar" value={formatDateTime(order.pg_paid_at)} />
          ) : null}
          {order.pg_expired_at && order.status === 'PENDING' ? (
            <ReceiptRow
              label="Kedaluwarsa"
              value={formatDateTime(order.pg_expired_at)}
            />
          ) : null}
          {order.pg_invoice ? (
            <ReceiptRow label="Invoice" value={order.pg_invoice} mono />
          ) : null}
          <View style={styles.divider} />
          <ReceiptRow
            label="Total"
            value={formatRupiah(order.pg_total ?? order.total ?? order.price)}
            strong
            valueColor={colors.coralDark}
          />
        </SurfaceCard>

        <SurfaceCard style={styles.card}>
          <AppText variant="labelSmall" color={colors.muted} style={styles.eyebrow}>
            DATA TUJUAN
          </AppText>
          {target ? (
            <ReceiptRow
              label={isPostpaid ? 'Nomor pelanggan' : 'ID / nomor tujuan'}
              value={String(target)}
              mono
            />
          ) : null}
          {details.zone_id ? (
            <ReceiptRow label="Zone / Server" value={String(details.zone_id)} mono />
          ) : null}
          {details.provider_qty ? (
            <ReceiptRow
              label="Nominal"
              value={formatRupiah(Number(details.provider_qty))}
            />
          ) : null}
          {isPostpaid && details.customer_name ? (
            <ReceiptRow label="Nama pelanggan" value={String(details.customer_name)} />
          ) : null}
          {isPostpaid && details.bill_period ? (
            <ReceiptRow label="Periode" value={String(details.bill_period)} />
          ) : null}
          {isPostpaid && details.bill_amount ? (
            <ReceiptRow
              label="Tagihan"
              value={formatRupiah(Number(details.bill_amount))}
            />
          ) : null}
          {isPostpaid && details.admin_fee ? (
            <ReceiptRow
              label="Biaya layanan"
              value={formatRupiah(Number(details.admin_fee))}
            />
          ) : null}
          {!target && !details.zone_id ? (
            <AppText variant="bodySmall" color={colors.muted}>
              Detail tujuan tidak tersedia.
            </AppText>
          ) : null}
        </SurfaceCard>

        {serial || licenses.length ? (
          <SurfaceCard style={styles.card}>
            <AppText variant="labelSmall" color={colors.muted} style={styles.eyebrow}>
              HASIL TRANSAKSI
            </AppText>
            {serial ? (
              <ReceiptRow label="Serial number" value={String(serial)} mono />
            ) : null}
            {licenses.map((license, index) => (
              <ReceiptRow
                key={`${license}-${index}`}
                label={`Lisensi ${index + 1}`}
                value={String(license)}
                mono
              />
            ))}
            {details.completed_at ? (
              <ReceiptRow
                label="Selesai pada"
                value={formatDateTime(String(details.completed_at))}
              />
            ) : null}
          </SurfaceCard>
        ) : null}

        <View style={styles.actions}>
          {!isFinalOrderStatus(status) ? (
            <SecondaryButton
              onPress={() => void handleRefresh()}
              loading={refreshing}
              icon="refresh"
            >
              Perbarui status
            </SecondaryButton>
          ) : null}
          <SecondaryButton
            onPress={() => router.push('/(tabs)/katalog')}
            icon="storefront-outline"
          >
            Belanja lagi
          </SecondaryButton>
        </View>

        <View style={styles.helpRow}>
          <MaterialCommunityIcons
            name="shield-check-outline"
            size={15}
            color={colors.muted}
          />
          <AppText variant="bodySmall" color={colors.muted}>
            Simpan nomor pesanan untuk keperluan bantuan.
          </AppText>
        </View>
      </ScreenScroll>

      <ConfirmDialog
        visible={cancelVisible}
        title="Batalkan pesanan?"
        message={
          cancelError ||
          'Pesanan hanya bisa dibatalkan selama masih menunggu pembayaran. Saldo akan dikembalikan otomatis.'
        }
        confirmLabel="Batalkan"
        destructive
        loading={cancelling}
        onConfirm={() => void handleCancel()}
        onDismiss={() => {
          if (!cancelling) setCancelVisible(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  pendingActions: {
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  banner: {
    marginTop: spacing.base,
  },
  card: {
    marginTop: spacing.base,
  },
  eyebrow: {
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
    marginVertical: spacing.xs,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.base,
  },
});
