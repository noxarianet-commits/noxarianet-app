import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { TextInput } from 'react-native-paper';

import { cancelTopup, createTopup, getPendingTopup } from '@/api/balance';
import { queryKeys } from '@/api/queryKeys';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton, TextButton } from '@/components/ui/Buttons';
import { InfoBanner } from '@/components/ui/InfoBanner';
import { KeyboardScreen, ScreenScroll } from '@/components/ui/Screen';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { TextField } from '@/components/ui/TextField';
import { useBalance } from '@/hooks/useBalance';
import { getErrorMessage } from '@/lib/errors';
import { formatDateTime, formatRupiah } from '@/lib/format';
import { saveTopupInfo } from '@/lib/storage';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

const PRESETS = [10000, 20000, 50000, 100000, 200000, 500000] as const;
const MIN_TOPUP = 10000;

export default function TopupScreen() {
  const queryClient = useQueryClient();
  const balanceQuery = useBalance();
  const pendingQuery = useQuery({
    queryKey: queryKeys.topupPending,
    queryFn: getPendingTopup,
    select: (response) => response.data,
    staleTime: 15 * 1000,
  });

  const [amount, setAmount] = useState('50000');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const pending = pendingQuery.data;
  const balance = balanceQuery.data?.balance ?? 0;
  const limit = balanceQuery.data?.balance_limit ?? 1000000;
  const remainingLimit = Math.max(0, limit - balance);
  const numericAmount = Number(amount) || 0;
  const limitReached = remainingLimit < MIN_TOPUP;

  const handleContinuePending = async () => {
    if (!pending) return;
    await saveTopupInfo({
      ref: pending.reference_id,
      id: pending.id,
      qrLink: pending.pg_qr_link || '',
      total: pending.pg_total ?? pending.amount,
      amount: pending.amount,
      expiresAt: pending.pg_expired_at || null,
      createdAt: pending.created_at || new Date().toISOString(),
    });
    router.push({ pathname: '/topup/[ref]', params: { ref: pending.reference_id } });
  };

  const handleCancelPending = async () => {
    if (!pending) return;
    setCancelling(true);
    setError(null);
    try {
      await cancelTopup(pending.reference_id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.topupPending });
      await queryClient.invalidateQueries({ queryKey: ['balance'] });
    } catch (cancelError) {
      setError(getErrorMessage(cancelError));
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!numericAmount) {
      setError('Masukkan nominal top up terlebih dahulu.');
      return;
    }
    if (numericAmount < MIN_TOPUP) {
      setError(`Minimal top up ${formatRupiah(MIN_TOPUP)}.`);
      return;
    }
    if (numericAmount > remainingLimit) {
      setError(
        `Top up melebihi batas saldo. Sisa ruang saldo kamu ${formatRupiah(remainingLimit)}.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await createTopup(numericAmount);
      await saveTopupInfo({
        ref: response.topup_id,
        qrLink: response.qr_link,
        total: response.total,
        amount: response.amount,
        expiresAt: null,
        createdAt: new Date().toISOString(),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.topupPending });
      void queryClient.invalidateQueries({ queryKey: ['balance'] });
      router.replace({
        pathname: '/topup/[ref]',
        params: { ref: response.topup_id },
      });
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardScreen>
      <ScreenScroll>
        <AppHeader title="Top up saldo" subtitle="Bayar dengan QRIS" />

        <View style={styles.balanceHead}>
          <View>
            <AppText variant="labelSmall" color={colors.muted}>
              SALDO SAAT INI
            </AppText>
            <AppText style={styles.balanceValue}>{formatRupiah(balance)}</AppText>
          </View>
          <View style={styles.limitPill}>
            <AppText variant="labelSmall" color={colors.muted}>
              MAKS {formatRupiah(limit)}
            </AppText>
          </View>
        </View>

        {pending ? (
          <SurfaceCard style={styles.pendingCard}>
            <View style={styles.pendingHead}>
              <View style={styles.pendingIcon}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color={colors.goldInk}
                />
              </View>
              <View style={styles.pendingCopy}>
                <AppText variant="titleMedium">Top up belum dibayar</AppText>
                <AppText variant="bodySmall" color={colors.muted}>
                  {formatRupiah(pending.pg_total ?? pending.amount)} ·{' '}
                  {formatDateTime(pending.created_at)}
                </AppText>
              </View>
            </View>
            <View style={styles.pendingActions}>
              <PrimaryButton
                fullWidth={false}
                onPress={() => void handleContinuePending()}
                style={styles.pendingButton}
              >
                Lanjutkan
              </PrimaryButton>
              <TextButton
                compact
                onPress={() => void handleCancelPending()}
                disabled={cancelling}
              >
                {cancelling ? 'Membatalkan…' : 'Batalkan'}
              </TextButton>
            </View>
          </SurfaceCard>
        ) : null}

        {error ? (
          <InfoBanner tone="danger" title="Top up belum dibuat" message={error} />
        ) : null}

        {limitReached ? (
          <InfoBanner
            tone="warning"
            title="Batas saldo sudah penuh"
            message={`Sisa ruang saldo kamu ${formatRupiah(remainingLimit)}. Gunakan saldo terlebih dahulu sebelum top up lagi.`}
          />
        ) : null}

        <SurfaceCard style={styles.card}>
          <AppText variant="labelSmall" color={colors.muted} style={styles.eyebrow}>
            NOMINAL TOP UP
          </AppText>
          <TextField
            label="Nominal"
            value={amount}
            onChangeText={(value) => {
              setAmount(value.replace(/\D/g, '').slice(0, 9));
              if (error) setError(null);
            }}
            keyboardType="number-pad"
            left={<TextInput.Affix text="Rp" />}
            hint={`Minimal ${formatRupiah(MIN_TOPUP)} · saldo masuk otomatis`}
          />

          <View style={styles.presets}>
            {PRESETS.map((preset) => {
              const active = numericAmount === preset;
              const disabled = preset > remainingLimit;
              return (
                <Pressable
                  key={preset}
                  disabled={disabled}
                  onPress={() => {
                    setAmount(String(preset));
                    if (error) setError(null);
                  }}
                  style={({ pressed }) => [
                    styles.preset,
                    active && styles.presetActive,
                    disabled && styles.presetDisabled,
                    pressed && !disabled ? styles.pressed : null,
                  ]}
                >
                  <AppText
                    variant="labelMedium"
                    color={active ? colors.coralInk : colors.inkSoft}
                  >
                    {formatRupiah(preset)}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <AppText variant="bodySmall" color={colors.muted}>
                Saldo setelah top up
              </AppText>
              <AppText variant="bodyMedium" weight="monoMedium">
                {formatRupiah(balance + numericAmount)}
              </AppText>
            </View>
            <View style={styles.summaryRow}>
              <AppText variant="bodySmall" color={colors.muted}>
                Sisa batas saldo
              </AppText>
              <AppText variant="bodySmall" color={colors.muted}>
                {formatRupiah(Math.max(0, remainingLimit - numericAmount))}
              </AppText>
            </View>
          </View>
        </SurfaceCard>

        <PrimaryButton
          onPress={() => void handleSubmit()}
          loading={submitting}
          disabled={submitting || limitReached || numericAmount < MIN_TOPUP}
          icon="qrcode-scan"
        >
          Buat pembayaran QRIS
        </PrimaryButton>

        <InfoBanner
          tone="info"
          title="Cara kerja top up"
          message="QRIS berlaku sekitar 30 menit. Setelah pembayaran terkonfirmasi, saldo langsung masuk dan riwayat transaksi tercatat otomatis."
        />

        <AppText variant="bodySmall" color={colors.muted} align="center" style={styles.note}>
          Membuat top up baru akan membatalkan tagihan top up yang masih pending.
        </AppText>
      </ScreenScroll>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  balanceHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  balanceValue: {
    fontFamily: fonts.monoMedium,
    fontSize: 28,
    lineHeight: 36,
    color: colors.ink,
  },
  limitPill: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.surface,
  },
  pendingCard: {
    marginBottom: spacing.base,
  },
  pendingHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pendingIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingCopy: {
    flex: 1,
    gap: 1,
  },
  pendingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pendingButton: {
    flex: 1,
  },
  card: {
    gap: spacing.md,
  },
  eyebrow: {
    letterSpacing: 1.2,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  preset: {
    minHeight: 40,
    minWidth: '30%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  presetActive: {
    borderColor: colors.coral,
    backgroundColor: colors.coralSoft,
  },
  presetDisabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.75,
  },
  summary: {
    gap: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingTop: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  note: {
    marginTop: spacing.sm,
  },
});
