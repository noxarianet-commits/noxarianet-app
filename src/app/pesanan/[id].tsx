import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { cancelOrder, getOrder } from '@/api/mobile';
import { queryKeys } from '@/api/queryKeys';
import { ReceiptModal } from '@/components/order/ReceiptModal';
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
import { useHardwareBackPress } from '@/hooks/useBackHandler';
import { getErrorMessage, isRateLimited } from '@/lib/errors';
import {
  formatDateTime,
  formatFullReceiptDateTime,
  formatLongDate,
  formatReceiptPaymentMethod,
  formatRupiah,
} from '@/lib/format';
import { RATE_LIMIT_POLL_DELAY } from '@/lib/polling';
import { colors, isFinalOrderStatus, radius, spacing } from '@/theme/tokens';

const STATUS_MESSAGES: Record<
  string,
  {
    tone: 'info' | 'warning' | 'danger' | 'success';
    title: string;
    message: string;
  }
> = {
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
  const isFocused = useIsFocused();

  const [cancelVisible, setCancelVisible] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  useHardwareBackPress(() => {
    if (receiptVisible) {
      setReceiptVisible(false);
      return true;
    }
    if (cancelVisible) {
      setCancelVisible(false);
      return true;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/pesanan');
    }
    return true;
  });

  const orderQuery = useQuery({
    queryKey: queryKeys.order(orderId),
    queryFn: () => getOrder(orderId),
    select: (response) => response.data,
    enabled: !!orderId && isFocused,
    refetchInterval: (query) => {
      if (!isFocused) return false;
      if (isRateLimited(query.state.error)) return RATE_LIMIT_POLL_DELAY;

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

  const copySerial = async (value: string) => {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  if (!orderId) {
    return (
      <ScreenScroll>
        <AppHeader
          title="Detail pesanan"
          onBack={() => router.replace('/(tabs)/pesanan')}
        />
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
        <AppHeader
          title="Detail pesanan"
          subtitle={orderId}
          onBack={() => router.replace('/(tabs)/pesanan')}
        />
        <LoadingState label="Memuat pesanan…" />
      </ScreenScroll>
    );
  }

  if (!order) {
    return (
      <ScreenScroll>
        <AppHeader
          title="Detail pesanan"
          subtitle={orderId}
          onBack={() => router.replace('/(tabs)/pesanan')}
        />
        <ErrorState
          error={orderQuery.error}
          title="Pesanan tidak ditemukan"
          onRetry={() => void orderQuery.refetch()}
        />
      </ScreenScroll>
    );
  }

  return (
    <ScreenScroll>
      <AppHeader
        title="Detail pesanan"
        subtitle={orderId}
        onBack={() => {
          if (router.canGoBack()) router.back();
          else router.replace('/(tabs)/pesanan');
        }}
        right={
          <Pressable
            onPress={() => setReceiptVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Cetak Struk"
            hitSlop={8}
            style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
          >
            <MaterialCommunityIcons
              name="printer-outline"
              size={22}
              color={colors.coralDark}
            />
          </Pressable>
        }
      />

      {statusInfo ? (
        <InfoBanner
          tone={statusInfo.tone}
          title={statusInfo.title}
          message={statusInfo.message}
          style={styles.banner}
        />
      ) : null}

      {refreshError ? (
        <InfoBanner
          tone="danger"
          title="Gagal memperbarui"
          message={refreshError}
          style={styles.banner}
        />
      ) : null}

      <SurfaceCard style={styles.card}>
        <View style={styles.cardHead}>
          <View style={styles.cardHeadLeft}>
            <AppText variant="titleMedium">{order.product}</AppText>
            <AppText variant="bodySmall" color={colors.muted}>
              {order.variant}
            </AppText>
          </View>
          <StatusPill status={order.status} />
        </View>

        <ReceiptRow label="Nomor Pesanan" value={order.id} copyable onCopy={copyOrderId} />
        {target ? <ReceiptRow label="Tujuan" value={String(target)} copyable /> : null}
        {isPostpaid && details.customer_name ? (
          <ReceiptRow label="Nama Pelanggan" value={String(details.customer_name)} />
        ) : null}
        {isPostpaid && details.bill_period ? (
          <ReceiptRow label="Periode" value={String(details.bill_period)} />
        ) : null}
        <ReceiptRow
          label="Metode Bayar"
          value={formatReceiptPaymentMethod(order.payment_type)}
        />
        <ReceiptRow label="Harga" value={formatRupiah(order.price)} />
        {order.fee ? <ReceiptRow label="Biaya Admin" value={formatRupiah(order.fee)} /> : null}
        <ReceiptRow
          label="Total Bayar"
          value={formatRupiah(order.total ?? order.price)}
          highlight
        />
        <ReceiptRow
          label="Waktu Pemesanan"
          value={formatFullReceiptDateTime(order.timestamp)}
        />
      </SurfaceCard>

      {serial ? (
        <SurfaceCard style={styles.card}>
          <AppText variant="titleSmall" style={styles.sectionTitle}>
            SN / Serial Number / Bukti
          </AppText>
          <ReceiptRow
            label="Serial Number"
            value={String(serial)}
            copyable
            onCopy={() => void copySerial(String(serial))}
            highlight
          />
        </SurfaceCard>
      ) : null}

      {licenses.length > 0 ? (
        <SurfaceCard style={styles.card}>
          <AppText variant="titleSmall" style={styles.sectionTitle}>
            Kode Voucher / Lisensi
          </AppText>
          {licenses.map((lic, idx) => (
            <ReceiptRow
              key={idx}
              label={`Kode ${idx + 1}`}
              value={lic}
              copyable
              onCopy={() => void copySerial(lic)}
              highlight
            />
          ))}
        </SurfaceCard>
      ) : null}

      <View style={styles.actions}>
        {/* Tombol Cetak & Bagikan Struk Bukti Transaksi */}
        <PrimaryButton
          icon="receipt-text-outline"
          onPress={() => setReceiptVisible(true)}
        >
          Cetak / Bagikan Struk
        </PrimaryButton>

        {awaitingPayment ? (
          <PrimaryButton
            onPress={() =>
              router.push({
                pathname: '/pembayaran/[orderId]',
                params: { orderId: order.id },
              })
            }
          >
            Lanjutkan Pembayaran
          </PrimaryButton>
        ) : null}

        {order.status === 'PENDING' ? (
          <SecondaryButton
            onPress={() => setCancelVisible(true)}
            loading={cancelling}
            disabled={cancelling}
          >
            Batalkan Pesanan
          </SecondaryButton>
        ) : null}

        {!isFinalOrderStatus(order.status) ? (
          <TextButton
            onPress={() => void handleRefresh()}
            loading={refreshing}
            disabled={refreshing}
          >
            Perbarui Status Sekarang
          </TextButton>
        ) : null}
      </View>

      <ConfirmDialog
        visible={cancelVisible}
        title="Batalkan Pesanan?"
        message="Apakah kamu yakin ingin membatalkan pesanan ini? Pesanan yang dibatalkan tidak dapat diproses kembali."
        confirmLabel="Ya, Batalkan"
        cancelLabel="Kembali"
        onConfirm={() => void handleCancel()}
        onDismiss={() => setCancelVisible(false)}
        loading={cancelling}
      />

      <ReceiptModal
        visible={receiptVisible}
        onClose={() => setReceiptVisible(false)}
        order={order}
      />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginBottom: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  cardHeadLeft: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  headerBtn: {
    padding: spacing.xs,
    borderRadius: radius.pill,
  },
  pressed: {
    opacity: 0.7,
  },
});

