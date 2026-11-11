import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { cancelTopup, getPendingTopup, getTopupStatus } from '@/api/balance';
import type { CachedTopupInfo } from '@/api/types';
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
import { getErrorMessage } from '@/lib/errors';
import { formatCountdown, formatRupiah } from '@/lib/format';
import { pollDelay } from '@/lib/polling';
import { loadTopupInfo } from '@/lib/storage';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

export default function TopupDetailScreen() {
  const params = useLocalSearchParams<{ ref?: string }>();
  const ref = params.ref || '';
  const queryClient = useQueryClient();

  const [cancelVisible, setCancelVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [wasCancelled, setWasCancelled] = useState(false);
  const [copied, setCopied] = useState(false);

  const cacheQuery = useQuery({
    queryKey: ['topup-cache', ref],
    queryFn: () => loadTopupInfo(ref),
    staleTime: Infinity,
    enabled: !!ref,
  });

  const statusQuery = useQuery({
    queryKey: queryKeys.topupStatus(ref),
    queryFn: () => getTopupStatus(ref),
    enabled: !!ref,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && status !== 'pending') return false;
      return pollDelay(query.state.dataUpdateCount);
    },
  });

  const cache = cacheQuery.data;
  const pendingQuery = useQuery({
    queryKey: queryKeys.topupPending,
    queryFn: getPendingTopup,
    enabled: cacheQuery.isSuccess && !cache,
    select: (response) => response.data,
    staleTime: 10 * 1000,
  });

  const record = statusQuery.data?.data;
  const pending = pendingQuery.data;
  const pendingMatch = pending?.reference_id === ref ? pending : null;

  const fallback: CachedTopupInfo | null = pendingMatch
    ? {
        ref: pendingMatch.reference_id,
        id: pendingMatch.id,
        qrLink: pendingMatch.pg_qr_link || '',
        total: pendingMatch.pg_total ?? pendingMatch.amount,
        amount: pendingMatch.amount,
        expiresAt: pendingMatch.pg_expired_at || null,
        createdAt: pendingMatch.created_at || new Date().toISOString(),
      }
    : null;

  const info = cache || fallback;
  const status = (
    statusQuery.data?.status ||
    record?.status ||
    (pendingMatch ? 'pending' : 'pending')
  ).toLowerCase();
  const effectiveStatus = wasCancelled ? 'cancelled' : status;

  const qrLink = record?.pg_qr_link || info?.qrLink || null;
  const total = record?.pg_total ?? info?.total ?? record?.amount ?? 0;
  const amount = record?.amount ?? info?.amount ?? 0;
  const createdAt = record?.created_at || info?.createdAt;
  const fallbackExpiresAt = createdAt
    ? new Date(new Date(createdAt).getTime() + 30 * 60 * 1000).toISOString()
    : null;
  const expiresAt = record?.pg_expired_at || info?.expiresAt || fallbackExpiresAt;
  const countdown = useCountdown(expiresAt);
  const expired = countdown.expired && !!expiresAt;
  const balanceAfter = record?.balance_after;

  useEffect(() => {
    if (status === 'completed') {
      void queryClient.invalidateQueries({ queryKey: ['balance'] });
      void queryClient.invalidateQueries({ queryKey: ['balance-history'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.topupPending });
    }
  }, [queryClient, status]);

  const copyRef = async () => {
    await Clipboard.setStringAsync(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError(null);
    try {
      await cancelTopup(ref);
      setWasCancelled(true);
      await queryClient.invalidateQueries({ queryKey: queryKeys.topupStatus(ref) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.topupPending });
      await statusQuery.refetch();
      setCancelVisible(false);
    } catch (error) {
      setCancelError(getErrorMessage(error));
    } finally {
      setCancelling(false);
    }
  };

  if (!ref) {
    return (
      <ScreenScroll>
        <AppHeader title="Top up saldo" />
        <ErrorState
          error={new Error('Referensi top up tidak ditemukan.')}
          title="Top up tidak valid"
          onRetry={() => router.replace('/topup')}
          retryLabel="Buat top up baru"
        />
      </ScreenScroll>
    );
  }

  if (cacheQuery.isPending || (!info && statusQuery.isPending)) {
    return (
      <ScreenScroll>
        <AppHeader title="Top up saldo" subtitle={ref} />
        <LoadingState label="Memeriksa top up…" />
      </ScreenScroll>
    );
  }

  if (!info && !record) {
    return (
      <ScreenScroll>
        <AppHeader title="Top up saldo" subtitle={ref} />
        <ErrorState
          error={statusQuery.error}
          title="Top up tidak ditemukan"
          onRetry={() => void statusQuery.refetch()}
        />
      </ScreenScroll>
    );
  }

  if (effectiveStatus === 'completed') {
    return (
      <ScreenScroll>
        <AppHeader title="Top up saldo" subtitle={ref} />
        <View style={styles.result}>
          <View style={[styles.resultIcon, styles.successIcon]}>
            <MaterialCommunityIcons
              name="check-decagram"
              size={40}
              color={colors.teal}
            />
          </View>
          <AppText variant="headlineSmall" align="center">
            Saldo sudah masuk
          </AppText>
          <AppText variant="bodyMedium" color={colors.muted} align="center">
            Top up {formatRupiah(amount)} berhasil dikreditkan ke saldo akunmu.
          </AppText>
          {typeof balanceAfter === 'number' ? (
            <View style={styles.afterBox}>
              <AppText variant="labelSmall" color={colors.muted}>
                SALDO SEKARANG
              </AppText>
              <AppText style={styles.afterValue}>
                {formatRupiah(balanceAfter)}
              </AppText>
            </View>
          ) : null}
          <View style={styles.resultActions}>
            <PrimaryButton onPress={() => router.replace('/topup')}>
              Top up lagi
            </PrimaryButton>
            <SecondaryButton onPress={() => router.replace('/saldo/riwayat')}>
              Riwayat saldo
            </SecondaryButton>
          </View>
        </View>
      </ScreenScroll>
    );
  }

  if (effectiveStatus === 'cancelled' || effectiveStatus === 'failed') {
    return (
      <ScreenScroll>
        <AppHeader title="Top up saldo" subtitle={ref} />
        <View style={styles.result}>
          <View style={[styles.resultIcon, styles.failIcon]}>
            <MaterialCommunityIcons
              name="close-octagon-outline"
              size={40}
              color={colors.danger}
            />
          </View>
          <AppText variant="headlineSmall" align="center">
            {effectiveStatus === 'cancelled' ? 'Top up dibatalkan' : 'Top up gagal'}
          </AppText>
          <AppText variant="bodyMedium" color={colors.muted} align="center">
            {effectiveStatus === 'cancelled'
              ? 'Tagihan ini sudah dibatalkan dan tidak akan menambah saldo.'
              : 'Pembayaran tidak dapat diproses. Silakan buat top up baru atau hubungi CS.'}
          </AppText>
          <View style={styles.resultActions}>
            <PrimaryButton onPress={() => router.replace('/topup')}>
              Buat top up baru
            </PrimaryButton>
            <SecondaryButton onPress={() => router.push('/bantuan')}>
              Hubungi CS
            </SecondaryButton>
          </View>
        </View>
      </ScreenScroll>
    );
  }

  return (
    <>
      <ScreenScroll>
        <AppHeader title="Top up saldo" subtitle={ref} />

        {statusQuery.isError ? (
          <InfoBanner
            tone="warning"
            title="Status belum terbarui"
            message={getErrorMessage(statusQuery.error)}
            style={styles.banner}
          />
        ) : null}

        <View style={styles.headRow}>
          <StatusPill status="PENDING" />
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
          <AppText variant="titleLarge">Scan untuk top up</AppText>
          <AppText variant="bodySmall" color={colors.muted} align="center">
            Saldo masuk otomatis setelah pembayaran terkonfirmasi.
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
            <AppText style={styles.amount}>{formatRupiah(total)}</AppText>
          </View>

          {expired ? (
            <InfoBanner
              tone="danger"
              title="Waktu pembayaran habis"
              message="QR ini sudah tidak berlaku. Batalkan top up lalu buat tagihan baru."
            />
          ) : null}
        </SurfaceCard>

        <SurfaceCard style={styles.detailCard}>
          <ReceiptRow label="Referensi" value={ref} mono />
          <ReceiptRow label="Nominal top up" value={formatRupiah(amount)} />
          <ReceiptRow label="Total bayar" value={formatRupiah(total)} />
          <View style={styles.copyRow}>
            <TextButton
              compact
              icon="content-copy"
              onPress={() => void copyRef()}
            >
              {copied ? 'Referensi disalin' : 'Salin referensi'}
            </TextButton>
          </View>
        </SurfaceCard>

        <View style={styles.actions}>
          <SecondaryButton
            onPress={() => void statusQuery.refetch()}
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
            Batalkan top up
          </PrimaryButton>
        </View>

        <View style={styles.autoNote}>
          <MaterialCommunityIcons name="sync" size={14} color={colors.muted} />
          <AppText variant="bodySmall" color={colors.muted}>
            Status dicek otomatis setiap beberapa detik.
          </AppText>
        </View>
      </ScreenScroll>

      <ConfirmDialog
        visible={cancelVisible}
        title="Batalkan top up?"
        message={cancelError || 'Tagihan QRIS ini akan dibatalkan dan tidak bisa dibayar lagi.'}
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
  banner: {
    marginBottom: spacing.md,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  detailCard: {
    marginTop: spacing.base,
  },
  copyRow: {
    flexDirection: 'row',
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
  result: {
    flex: 1,
    minHeight: 520,
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
  successIcon: {
    backgroundColor: colors.tealSoft,
  },
  failIcon: {
    backgroundColor: colors.dangerSoft,
  },
  afterBox: {
    alignItems: 'center',
    gap: 1,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  afterValue: {
    fontFamily: fonts.monoMedium,
    fontSize: 22,
    color: colors.ink,
  },
  resultActions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
