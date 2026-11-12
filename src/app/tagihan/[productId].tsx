import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createOrder, inquiryBill } from '@/api/mobile';
import type { BillQuote, CreateOrderPayload } from '@/api/types';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Buttons';
import { InfoBanner } from '@/components/ui/InfoBanner';
import { ReceiptRow } from '@/components/ui/ReceiptRow';
import { KeyboardScreen, Screen } from '@/components/ui/Screen';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { TextField } from '@/components/ui/TextField';
import { VariantRow } from '@/components/product/VariantRow';
import { useBalance } from '@/hooks/useBalance';
import { useCountdown } from '@/hooks/useCountdown';
import { useProduct } from '@/hooks/useProduct';
import { getErrorCode, getErrorMessage } from '@/lib/errors';
import { formatCountdown, formatRupiah } from '@/lib/format';
import {
  getOrCreateOrderKey,
  orderFingerprint,
  releaseOrderKey,
} from '@/lib/idempotency';
import { getBillVariants, getVariantFields } from '@/lib/products';
import { colors, fonts, spacing } from '@/theme/tokens';

const INQUIRY_ERRORS: Record<string, string> = {
  BILL_NOT_CONFIGURED:
    'Produk ini belum siap menerima cek tagihan. Hubungi CS untuk info lebih lanjut.',
  BILL_INQUIRY_FAILED:
    'Tagihan tidak ditemukan. Periksa kembali nomor pelanggan atau ID meter.',
  BILL_AMOUNT_INVALID: 'Nominal tagihan tidak valid.',
  BILL_VENDOR_UNSUPPORTED:
    'Vendor tagihan ini belum mendukung cek tagihan dari aplikasi.',
  VENDOR_BALANCE_LOW:
    'Saldo server tagihan sedang diisi. Coba lagi beberapa saat lagi.',
  SHOP_CLOSED: 'Toko sedang tutup. Silakan coba lagi nanti.',
  ACCOUNT_INACTIVE: 'Akun kamu tidak aktif. Hubungi CS.',
  RATE_LIMITED: 'Terlalu banyak permintaan cek tagihan. Tunggu sebentar.',
};

const ORDER_ERRORS: Record<string, string> = {
  INSUFFICIENT_BALANCE: 'Saldo tidak mencukupi. Top up saldo dulu ya.',
  BILL_INQUIRY_EXPIRED:
    'Quote tagihan sudah kedaluwarsa. Silakan cek ulang nominalnya.',
  BILL_INQUIRY_ALREADY_USED: 'Tagihan ini sudah diproses sebelumnya.',
  BILL_AMOUNT_MISMATCH:
    'Nominal tagihan berubah. Silakan cek ulang tagihannya.',
  BILL_INQUIRY_NOT_FOUND: 'Quote tagihan tidak ditemukan. Silakan cek ulang.',
  PROFILE_INCOMPLETE:
    'Lengkapi email dan nomor telepon di profil sebelum membayar tagihan.',
  SHOP_CLOSED: 'Toko sedang tutup. Silakan coba lagi nanti.',
  VENDOR_BALANCE_LOW:
    'Saldo server tagihan sedang diisi. Coba lagi beberapa saat lagi.',
};

export default function BillInquiryScreen() {
  const params = useLocalSearchParams<{ productId?: string; variantId?: string }>();
  const productId = params.productId || '';
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const productQuery = useProduct(productId);
  const balanceQuery = useBalance();

  const [variantId, setVariantId] = useState<string | null>(
    params.variantId || null,
  );
  const [customerNumber, setCustomerNumber] = useState('');
  const [quote, setQuote] = useState<BillQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [paying, setPaying] = useState(false);

  const product = productQuery.data;
  const variants = useMemo(
    () => (product ? getBillVariants(product) : []),
    [product],
  );
  const selectedVariant =
    variants.find((variant) => String(variant.id) === variantId) || variants[0];

  const numberField = selectedVariant
    ? getVariantFields(selectedVariant).find(
        (field) => field.key === 'customer_number',
      ) || getVariantFields(selectedVariant)[0]
    : undefined;
  const numberLabel = numberField?.label || 'Nomor Pelanggan / ID Meter';

  const countdown = useCountdown(quote?.expires_at || null);
  const quoteExpired = !!quote && countdown.expired;
  const balance = balanceQuery.data?.balance ?? 0;
  const total = quote?.bill.total ?? 0;
  const insufficientBalance = !!quote && total > balance;

  const handleCheck = async () => {
    if (!product || !selectedVariant) return;

    const number = customerNumber.trim();
    if (!number) {
      setError('Isi nomor pelanggan atau ID meter terlebih dahulu.');
      return;
    }
    if (number.length < 4) {
      setError('Nomor pelanggan terlalu pendek. Periksa kembali.');
      return;
    }

    setError(null);
    setChecking(true);
    try {
      const response = await inquiryBill({
        product_id: product.id,
        variant_id: String(selectedVariant.id),
        customer_number: number,
      });
      setQuote(response.data);
    } catch (checkError) {
      const code = getErrorCode(checkError);
      setError(
        (code && INQUIRY_ERRORS[code]) || getErrorMessage(checkError),
      );
    } finally {
      setChecking(false);
    }
  };

  const handlePay = async () => {
    if (!quote) return;

    setError(null);
    setPaying(true);
    try {
      const payload: CreateOrderPayload = {
        type: 'bill',
        inquiry_id: quote.inquiry_id,
        payment_type: 'balance',
      };
      const orderKey = await getOrCreateOrderKey(orderFingerprint(payload));
      const response = await createOrder(payload, orderKey.key);
      await releaseOrderKey(orderKey.storageKey);

      void queryClient.invalidateQueries({ queryKey: ['balance'] });
      void queryClient.invalidateQueries({ queryKey: ['balance-history'] });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });

      router.replace({
        pathname: '/pesanan/[id]',
        params: { id: response.data.order_id },
      });
    } catch (payError) {
      const code = getErrorCode(payError);
      setError((code && ORDER_ERRORS[code]) || getErrorMessage(payError));
    } finally {
      setPaying(false);
    }
  };

  if (productQuery.isPending) {
    return (
      <Screen>
        <AppHeader title="Cek tagihan" />
        <LoadingState label="Memuat produk tagihan…" />
      </Screen>
    );
  }

  if (!product || !selectedVariant) {
    return (
      <Screen>
        <AppHeader title="Cek tagihan" />
        <ErrorState
          error={productQuery.error}
          title="Produk tagihan tidak tersedia"
          onRetry={() => void productQuery.refetch()}
        />
      </Screen>
    );
  }

  return (
    <KeyboardScreen>
      <Screen padded>
        <AppHeader title="Cek tagihan" subtitle={product.name} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {error ? (
            <InfoBanner
              tone="danger"
              title="Cek tagihan gagal"
              message={error}
            />
          ) : null}

          <SurfaceCard style={styles.card}>
            <AppText variant="labelSmall" color={colors.muted} style={styles.eyebrow}>
              01 / JENIS TAGIHAN
            </AppText>
            <AppText variant="titleLarge">Pilih kategori tagihan</AppText>

            {variants.length > 1 ? (
              <View style={styles.variantList}>
                {variants.map((variant) => (
                  <VariantRow
                    key={`bill-${variant.id}`}
                    variant={variant}
                    selected={String(variant.id) === String(selectedVariant.id)}
                    onPress={() => {
                      setVariantId(String(variant.id));
                      setQuote(null);
                    }}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.singleVariant}>
                <MaterialCommunityIcons
                  name="receipt-text-outline"
                  size={16}
                  color={colors.muted}
                />
                <AppText variant="bodyMedium">{selectedVariant.name}</AppText>
              </View>
            )}
          </SurfaceCard>

          <SurfaceCard style={styles.card}>
            <AppText variant="labelSmall" color={colors.muted} style={styles.eyebrow}>
              02 / NOMOR PELANGGAN
            </AppText>
            <AppText variant="titleLarge">Masukkan nomor tujuan</AppText>
            <TextField
              label={numberLabel}
              value={customerNumber}
              onChangeText={(value) => {
                setCustomerNumber(value.replace(/[^\d]/g, '').slice(0, 30));
                if (error) setError(null);
              }}
              keyboardType="number-pad"
              autoCorrect={false}
              placeholder="Contoh: 51234567890"
              left={<TextInput.Icon icon="account-number-outline" color={colors.muted} />}
            />
            <SecondaryButton
              onPress={() => void handleCheck()}
              loading={checking}
              disabled={checking || paying}
              icon="magnify"
            >
              Cek tagihan
            </SecondaryButton>
          </SurfaceCard>

          {quote ? (
            <SurfaceCard style={styles.card}>
              <View style={styles.quoteHead}>
                <AppText variant="labelSmall" color={colors.coralDark}>
                  HASIL CEK TAGIHAN
                </AppText>
                <View style={styles.countdownPill}>
                  <MaterialCommunityIcons
                    name="timer-outline"
                    size={13}
                    color={quoteExpired ? colors.danger : colors.teal}
                  />
                  <AppText
                    variant="labelSmall"
                    color={quoteExpired ? colors.danger : colors.teal}
                  >
                    {quoteExpired
                      ? 'KEDALUWARSA'
                      : formatCountdown(countdown.remainingMs)}
                  </AppText>
                </View>
              </View>

              <ReceiptRow label="Pelanggan" value={quote.customer.number} mono />
              {quote.customer.name ? (
                <ReceiptRow label="Nama" value={quote.customer.name} />
              ) : null}
              {quote.bill.period ? (
                <ReceiptRow label="Periode" value={quote.bill.period} />
              ) : null}
              <ReceiptRow label="Jenis" value={quote.variant.name} />
              <View style={styles.divider} />
              <ReceiptRow
                label="Tagihan"
                value={formatRupiah(quote.bill.amount)}
              />
              <ReceiptRow
                label="Biaya layanan"
                value={
                  quote.bill.admin_fee > 0
                    ? formatRupiah(quote.bill.admin_fee)
                    : 'Gratis'
                }
              />
              <View style={styles.divider} />
              <ReceiptRow
                label="Total bayar"
                value={formatRupiah(quote.bill.total)}
                strong
                valueColor={colors.coralDark}
              />

              {quoteExpired ? (
                <InfoBanner
                  tone="danger"
                  title="Quote sudah kedaluwarsa"
                  message="Cek tagihan ulang untuk mendapat nominal terbaru."
                />
              ) : null}

              {!quoteExpired && insufficientBalance ? (
                <InfoBanner
                  tone="warning"
                  title="Saldo tidak cukup"
                  message={`Saldo kamu ${formatRupiah(balance)}. Top up saldo dulu sebelum membayar tagihan.`}
                  action={
                    <SecondaryButton
                      fullWidth={false}
                      onPress={() => router.push('/topup')}
                    >
                      Top up saldo
                    </SecondaryButton>
                  }
                />
              ) : null}

              <AppText variant="bodySmall" color={colors.muted}>
                Tagihan hanya bisa dibayar dengan saldo Noxarianet.
              </AppText>
            </SurfaceCard>
          ) : null}
        </ScrollView>

        <View
          style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}
        >
          <View style={styles.footerTotal}>
            <AppText variant="labelSmall" color={colors.muted}>
              TOTAL BAYAR
            </AppText>
            <AppText
              style={styles.footerPrice}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {quote ? formatRupiah(quote.bill.total) : '—'}
            </AppText>
          </View>
          <PrimaryButton
            fullWidth={false}
            onPress={() => void handlePay()}
            loading={paying}
            disabled={
              paying || checking || !quote || quoteExpired || insufficientBalance
            }
            style={styles.submit}
          >
            Bayar tagihan
          </PrimaryButton>
        </View>
      </Screen>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.lg,
    gap: spacing.base,
  },
  card: {
    gap: spacing.md,
  },
  eyebrow: {
    letterSpacing: 1.2,
  },
  variantList: {
    gap: spacing.sm,
  },
  singleVariant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quoteHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    flexShrink: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
    marginVertical: spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  footerTotal: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  footerPrice: {
    fontFamily: fonts.monoMedium,
    fontSize: 18,
  },
  submit: {
    minWidth: 150,
    flexShrink: 0,
  },
});
