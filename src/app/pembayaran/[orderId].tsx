import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { cancelOrder } from '@/api/mobile';
import { getPaymentStatus } from '@/api/payments';
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
import { useCountdown } from '@/hooks/useCountdown';
import { useHardwareBackPress } from '@/hooks/useBackHandler';
import { getErrorMessage } from '@/lib/errors';
import { formatCountdown, formatRupiah } from '@/lib/format';
import { notifyOrderFailed, notifyOrderSuccess } from '@/lib/notifications';
import { pollDelay } from '@/lib/polling';
import { loadPaymentInfo } from '@/lib/storage';
import {
  colors,
  fonts,
  isFinalOrderStatus,
  radius,
  spacing,
} from '@/theme/tokens';

export default function PaymentScreen() {
  const params = useLocalSearchParams<{ orderId?: string }>();
  const orderId = params.orderId || '';
  const queryClient = useQueryClient();

  const [cancelVisible, setCancelVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useHardwareBackPress(() => {
    if (cancelVisible) {
      setCancelVisible(false);
      return true;
    }
    router.replace('/(tabs)/pesanan');
    return true;
  });

  const cacheQuery = useQuery({
    queryKey: ['payment-cache', orderId],
    queryFn: () => loadPaymentInfo(orderId),
    staleTime: Infinity,
    enabled: !!orderId,
  });

  const statusQuery = useQuery({
    queryKey: queryKeys.paymentStatus(orderId),
    queryFn: () => getPaymentStatus(orderId),
    enabled: !!orderId,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (status && isFinalOrderStatus(status)) return false;
      return pollDelay(query.state.dataUpdateCount);
    },
  });

  const order = statusQuery.data?.data;
  const cache = cacheQuery.data;
  const status = order?.status;
  const paymentType = order?.payment_type || cache?.paymentType || 'gateway';
  const qrLink = order?.pg_qr_link || order?.payment_link || cache?.qrLink || null;

  const fallbackExpiresAt = cache?.createdAt
    ? new Date(new Date(cache.createdAt).getTime() + 30 * 60 * 1000).toISOString()
    : null;
  const expiresAt = order?.pg_expired_at || cache?.expiresAt || fallbackExpiresAt;
  const countdown = useCountdown(expiresAt);

  const total =
    order?.pg_total ??
    cache?.total ??
    order?.total ??
    order?.price ??
    0;

  const notifiedOrderStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (status && isFinalOrderStatus(status)) {
      if (notifiedOrderStatusRef.current !== status) {
        notifiedOrderStatusRef.current = status;
        if (status === 'COMPLETED') {
          notifyOrderSuccess(order?.product || 'Pesanan', order?.variant);
        } else if (status === 'FAILED' || status === 'CANCELLED') {
          notifyOrderFailed(order?.product || 'Pesanan', order?.variant);
        }
      }
      void queryClient.invalidateQueries({ queryKey: ['balance'] });
      void queryClient.invalidateQueries({ queryKey: ['balance-history'] });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    }
  }, [order?.product, order?.variant, orderId, queryClient, status]);

  const copyValue = async (label: string, value: string) => {
    await Clipboard.setStringAsync(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1800);
  };

  const handleCheckNow = async () => {
    try {
      await queryClient.fetchQuery({
        queryKey: queryKeys.paymentStatus(orderId),
        queryFn: () => getPaymentStatus(orderId, true),
        staleTime: 0,
      });
    } catch {
      // The banner above already shows the query error when it persists.
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelOrder(orderId);
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      await queryClient.invalidateQueries({ queryKey: ['balance'] });
      setCancelVisible(false);
      router.replace({ pathname: '/pesanan/[id]', params: { id: orderId } });
    } catch (error) {
      setCancelError(getErrorMessage(error));
    } finally {
      setCancelling(false);
    }
  };

  if (!orderId) {
    return (
      <ScreenScroll>
        <AppHeader
          title="Pembayaran"
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

  if (cacheQuery.isPending || (statusQuery.isPending && !cache)) {
    return (
      <ScreenScroll>
        <AppHeader
          title="Pembayaran"
          subtitle={orderId}
          onBack={() => router.replace('/(tabs)/pesanan')}
        />
        <LoadingState label="Memeriksa status pembayaran…" />
      </ScreenScroll>
    );
  }

  if (!order && !cache) {
    return (
      <ScreenScroll>
        <AppHeader
          title="Pembayaran"
          subtitle={orderId}
          onBack={() => router.replace('/(tabs)/pesanan')}
        />
        <ErrorState
          error={statusQuery.error}
          title="Pembayaran tidak ditemukan"
          onRetry={() => void statusQuery.refetch()}
        />
      </ScreenScroll>
    );
  }

  if (status === 'COMPLETED' || status === 'REFUNDED') {
    return (
      <ResultView
        tone="success"
        icon="check-decagram"
        title={status === 'REFUNDED' ? 'Dana sudah dikembalikan' : 'Pembayaran berhasil'}
        message={
          status === 'REFUNDED'
            ? 'Saldo sudah kembali ke akunmu.'
            : 'Pesanan sedang diproses otomatis. Detail dan nomor seri akan muncul di halaman pesanan.'
        }
        orderId={orderId}
        onPrimary={() =>
          router.replace({ pathname: '/pesanan/[id]', params: { id: orderId } })
        }
        onSecondary={() => router.replace('/(tabs)/pesanan')}
      />
    );
  }

  if (status === 'CANCELLED' || status === 'FAILED') {
    return (
      <ResultView
        tone="danger"
        icon="close-octagon-outline"
        title={status === 'CANCELLED' ? 'Pesanan dibatalkan' : 'Pesanan gagal'}
        message={
          order?.error_message ||
          (status === 'CANCELLED'
            ? 'Pesanan ini sudah dibatalkan.'
            : 'Pesanan tidak dapat diproses. Silakan hubungi CS jika saldo sudah terpotong.')
        }
        orderId={orderId}
        onPrimary={() =>
          router.replace({ pathname: '/pesanan/[id]', params: { id: orderId } })
        }
        onSecondary={() => router.replace('/(tabs)/pesanan')}
      />
    );
  }

  const awaitingPayment =
    paymentType !== 'balance' && (!status || status === 'PENDING');
  const usingBalance = paymentType === 'balance';
  const expired = countdown.expired && !!expiresAt;

  return (
    <>
      <ScreenScroll>
        <AppHeader
          title="Pembayaran"
          subtitle={orderId}
          onBack={() =>
            router.replace({ pathname: '/pesanan/[id]', params: { id: orderId } })
          }
        />

        {statusQuery.isError ? (
          <InfoBanner
            tone="warning"
            title="Status belum terbarui"
            message={getErrorMessage(statusQuery.error)}
            style={styles.banner}
          />
        ) : null}

        {awaitingPayment ? (
          <>
            <View style={styles.qrHead}>
              <StatusPill status={status || 'PENDING'} />
              <AppText variant="labelSmall" color={colors.muted}>
                {expiresAt
                  ? expired
                    ? 'WAKTU HABIS'
                    : `SISA ${formatCountdown(countdown.remainingMs)}`
                  : 'MENUNGGU PEMBAYARAN'}
              </AppText>
            </View>

            <SurfaceCard style={styles.qrCard}>
              <AppText variant="labelSmall" color={colors.coralDark}>
                QRIS
              </AppText>
              <AppText variant="titleLarge">Scan untuk membayar</AppText>
              <AppText variant="bodySmall" color={colors.muted} align="center">
                Nominal sudah terisi otomatis. Jangan ubah nominal pembayaran.
              </AppText>

              {qrLink ? (
                <View style={[styles.qrBox, expired && styles.qrBoxExpired]}>
                  <Image
                    source={{ uri: qrLink }}
                    style={styles.qrImage}
                    contentFit="contain"
                    transition={200}
                  />
                </View>
              ) : (
                <View style={styles.qrEmpty}>
                  <ActivityIndicator color={colors.coralDark} />
                  <AppText variant="bodySmall" color={colors.muted}>
                    Menyiapkan QR pembayaran…
                  </AppText>
                </View>
              )}

              <View style={styles.amountBox}>
                <AppText variant="labelSmall" color={colors.muted}>
                  TOTAL BAYAR
                </AppText>
                <AppText
                  style={styles.amount}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatRupiah(total)}
                </AppText>
              </View>

              {expired ? (
                <InfoBanner
                  tone="danger"
                  title="Waktu pembayaran habis"
                  message="QR ini sudah tidak berlaku. Batalkan pesanan lalu buat pesanan baru."
                />
              ) : (
                <View style={styles.instructions}>
                  {[
                    'Buka aplikasi bank atau e-wallet yang mendukung QRIS.',
                    'Pilih menu bayar dengan QR, lalu scan kode di atas.',
                    'Periksa nominal dan selesaikan pembayaran.',
                  ].map((step, index) => (
                    <View key={step} style={styles.instructionRow}>
                      <View style={styles.instructionNumber}>
                        <AppText variant="labelSmall" color={colors.coralInk}>
                          {index + 1}
                        </AppText>
                      </View>
                      <AppText variant="bodySmall" color={colors.muted} style={styles.instructionText}>
                        {step}
                      </AppText>
                    </View>
                  ))}
                </View>
              )}
            </SurfaceCard>

            <SurfaceCard style={styles.detailCard}>
              <ReceiptRow label="Nomor pesanan" value={orderId} mono />
              <ReceiptRow
                label="Metode"
                value="QRIS"
              />
              {order?.variant ? (
                <ReceiptRow label="Produk" value={`${order.product} · ${order.variant}`} />
              ) : null}
              <View style={styles.copyRow}>
                <TextButton
                  compact
                  onPress={() => void copyValue('id', orderId)}
                  icon="content-copy"
                >
                  {copied === 'id' ? 'ID disalin' : 'Salin ID pesanan'}
                </TextButton>
                <TextButton
                  compact
                  onPress={() => void copyValue('total', String(total))}
                  icon="cash-multiple"
                >
                  {copied === 'total' ? 'Nominal disalin' : 'Salin nominal'}
                </TextButton>
              </View>
            </SurfaceCard>

            <View style={styles.actions}>
              <SecondaryButton
                onPress={() => void handleCheckNow()}
                loading={statusQuery.isRefetching}
              >
                Cek status sekarang
              </SecondaryButton>
              <PrimaryButton
                buttonColor={colors.dangerSoft}
                textColor={colors.danger}
                onPress={() => {
                  setCancelError(null);
                  setCancelVisible(true);
                }}
              >
                Batalkan pesanan
              </PrimaryButton>
            </View>

            <View style={styles.autoNote}>
              <MaterialCommunityIcons
                name="sync"
                size={14}
                color={colors.muted}
              />
              <AppText variant="bodySmall" color={colors.muted}>
                Status dicek otomatis setiap beberapa detik.
              </AppText>
            </View>
          </>
        ) : (
          <View style={styles.processing}>
            <View style={styles.processingIcon}>
              <ActivityIndicator color={colors.coralDark} size="large" />
            </View>
            <AppText variant="headlineSmall" align="center">
              Pesanan sedang diproses
            </AppText>
            <AppText variant="bodyMedium" color={colors.muted} align="center">
              {usingBalance
                ? 'Saldo sudah dipotong dan pesanan sedang dikirim ke penyedia. Halaman ini akan diperbarui otomatis.'
                : 'Pembayaran diterima. Pesanan sedang diproses oleh penyedia dan status akan diperbarui otomatis.'}
            </AppText>
            <StatusPill status={status || 'PROCESSING'} />
            <PrimaryButton
              onPress={() =>
                router.replace({
                  pathname: '/pesanan/[id]',
                  params: { id: orderId },
                })
              }
            >
              Lihat detail pesanan
            </PrimaryButton>
            <TextButton onPress={() => void handleCheckNow()}>
              Perbarui status
            </TextButton>
          </View>
        )}
      </ScreenScroll>

      <ConfirmDialog
        visible={cancelVisible}
        title="Batalkan pesanan?"
        message={
          cancelError ||
          'Pesanan hanya bisa dibatalkan selama belum diproses. Saldo akan dikembalikan otomatis untuk pembayaran saldo.'
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

function ResultView({
  tone,
  icon,
  title,
  message,
  orderId,
  onPrimary,
  onSecondary,
}: {
  tone: 'success' | 'danger';
  icon: 'check-decagram' | 'close-octagon-outline';
  title: string;
  message: string;
  orderId: string;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  const palette =
    tone === 'success'
      ? { bg: colors.tealSoft, fg: colors.teal }
      : { bg: colors.dangerSoft, fg: colors.danger };

  return (
    <ScreenScroll>
      <AppHeader
        title="Pembayaran"
        subtitle={orderId}
        onBack={() => router.replace('/(tabs)/pesanan')}
      />
      <View style={styles.result}>
        <View style={[styles.resultIcon, { backgroundColor: palette.bg }]}>
          <MaterialCommunityIcons name={icon} size={40} color={palette.fg} />
        </View>
        <AppText variant="headlineSmall" align="center">
          {title}
        </AppText>
        <AppText variant="bodyMedium" color={colors.muted} align="center" style={styles.resultCopy}>
          {message}
        </AppText>
        <AppText variant="labelSmall" color={colors.muted}>
          {orderId}
        </AppText>
        <View style={styles.resultActions}>
          <PrimaryButton onPress={onPrimary}>Lihat pesanan</PrimaryButton>
          <SecondaryButton onPress={onSecondary}>Ke riwayat pesanan</SecondaryButton>
        </View>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginBottom: spacing.md,
  },
  qrHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  qrCard: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  qrBox: {
    width: 248,
    height: 248,
    maxWidth: '100%',
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  qrBoxExpired: {
    opacity: 0.35,
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  qrEmpty: {
    width: 248,
    height: 218,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  amountBox: {
    alignItems: 'center',
    gap: 1,
    marginTop: spacing.xs,
  },
  amount: {
    fontFamily: fonts.monoMedium,
    fontSize: 30,
    lineHeight: 38,
    color: colors.ink,
  },
  instructions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  instructionNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.coralSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  instructionText: {
    flex: 1,
    lineHeight: 20,
  },
  detailCard: {
    marginTop: spacing.base,
  },
  copyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  autoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.base,
  },
  processing: {
    flex: 1,
    minHeight: 460,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  processingIcon: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.coralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  result: {
    flex: 1,
    minHeight: 480,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  resultIcon: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  resultCopy: {
    maxWidth: 340,
    marginBottom: spacing.xs,
  },
  resultActions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
