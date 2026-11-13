import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createOrder, validateProduct } from '@/api/mobile';
import type {
  CreateOrderPayload,
  Product,
  ProductServer,
  ProductVariant,
} from '@/api/types';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Buttons';
import { InfoBanner } from '@/components/ui/InfoBanner';
import { ReceiptRow } from '@/components/ui/ReceiptRow';
import { KeyboardScreen, Screen } from '@/components/ui/Screen';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { TextField } from '@/components/ui/TextField';
import { useBalance } from '@/hooks/useBalance';
import { useProduct } from '@/hooks/useProduct';
import { getErrorMessage, getErrorCode } from '@/lib/errors';
import { formatRupiah } from '@/lib/format';
import {
  getOrCreateOrderKey,
  orderFingerprint,
  releaseOrderKey,
} from '@/lib/idempotency';
import {
  findVariant,
  getVariantFields,
  isOpenDenom,
  isPostpaidProduct,
  openDenomMax,
  openDenomMin,
  variantPrice,
} from '@/lib/products';
import { savePaymentInfo } from '@/lib/storage';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

type PaymentType = 'balance' | 'gateway';

type ValidationState = {
  valid: boolean;
  title: string;
  message: string;
};

export default function CheckoutScreen() {
  const params = useLocalSearchParams<{
    productId?: string;
    variantId?: string;
    vendor?: string;
  }>();
  const productQuery = useProduct(params.productId);
  const balanceQuery = useBalance();

  const product = productQuery.data;
  const match = useMemo(
    () => findVariant(product, params.variantId, params.vendor),
    [product, params.variantId, params.vendor],
  );

  if (productQuery.isPending) {
    return (
      <Screen>
        <AppHeader title="Checkout" />
        <LoadingState label="Menyiapkan checkout…" />
      </Screen>
    );
  }

  if (!product || !match) {
    return (
      <Screen>
        <AppHeader title="Checkout" />
        <ErrorState
          error={productQuery.error}
          title="Produk tidak tersedia"
          onRetry={() => void productQuery.refetch()}
        />
      </Screen>
    );
  }

  // Produk tagihan tidak punya nominal tetap: alurnya cek tagihan dulu.
  if (isPostpaidProduct(product)) {
    return (
      <Screen>
        <AppHeader title="Checkout" />
        <ErrorState
          error={new Error('Produk tagihan harus lewat alur cek tagihan.')}
          title="Gunakan cek tagihan"
          onRetry={() =>
            router.replace({
              pathname: '/tagihan/[productId]',
              params: { productId: String(product.id) },
            })
          }
          retryLabel="Buka cek tagihan"
        />
      </Screen>
    );
  }

  return (
    <CheckoutForm
      key={`${product.id}-${match.variant.id}`}
      product={product}
      server={match.server}
      variant={match.variant}
      balance={balanceQuery.data?.balance ?? 0}
      balanceLoading={balanceQuery.isPending}
    />
  );
}

function CheckoutForm({
  product,
  server,
  variant,
  balance,
  balanceLoading,
}: {
  product: Product;
  server: ProductServer;
  variant: ProductVariant;
  balance: number;
  balanceLoading: boolean;
}) {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();

  const fieldDefs = useMemo(() => getVariantFields(variant), [variant]);

  const [fields, setFields] = useState<Record<string, string>>(() =>
    Object.fromEntries(fieldDefs.map((field) => [field.key, ''])),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [providerQty, setProviderQty] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('balance');
  const [formError, setFormError] = useState<string | null>(null);
  const [formErrorCode, setFormErrorCode] = useState<string | undefined>();
  const [validation, setValidation] = useState<ValidationState | null>(null);
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const openDenom = isOpenDenom(variant);
  const qty = Number(providerQty) || 0;
  const basePrice = variantPrice(variant);
  const total = openDenom ? qty + basePrice : basePrice;
  const minQty = openDenomMin(variant);
  const maxQty = openDenomMax(variant);
  const insufficientBalance = total > balance;

  const effectivePaymentType: PaymentType =
    paymentType === 'balance' && !balanceLoading && insufficientBalance
      ? 'gateway'
      : paymentType;

  const targetKey =
    fieldDefs.find((field) =>
      ['customer_id', 'user_id', 'target', 'note'].includes(field.key),
    )?.key || fieldDefs[0]?.key;

  const updateField = (key: string, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((current) => ({ ...current, [key]: '' }));
    }
    if (validation) setValidation(null);
  };

  const buildCleanFields = () => {
    const clean: Record<string, string> = {};
    for (const [key, value] of Object.entries(fields)) {
      const trimmed = value.trim();
      if (trimmed) clean[key] = trimmed;
    }
    const targetValue = targetKey ? fields[targetKey]?.trim() : '';
    if (targetValue && !clean.customer_id) {
      clean.customer_id = targetValue;
    }
    if (openDenom) clean.provider_qty = String(qty);
    return clean;
  };

  const handleValidate = async () => {
    const errors: Record<string, string> = {};
    for (const field of fieldDefs) {
      if (field.required !== false && !fields[field.key]?.trim()) {
        errors[field.key] = `${field.label} wajib diisi.`;
      }
    }
    setFieldErrors(errors);
    setFormError(null);
    setFormErrorCode(undefined);
    setValidation(null);

    if (Object.keys(errors).length) return;
    const customerId = targetKey ? fields[targetKey]?.trim() : '';
    if (!customerId) {
      setFormError('Isi ID akun / nomor tujuan terlebih dahulu.');
      return;
    }

    setValidating(true);
    try {
      const response = await validateProduct({
        product_id: product.id,
        variant_id: String(variant.id),
        customer_id: customerId,
        zone_id: fields.zone_id?.trim() || undefined,
      });
      if (response.valid) {
        const name = response.display_name || response.account_name;
        setValidation({
          valid: true,
          title: name ? 'ID akun ditemukan' : 'ID valid',
          message:
            name ||
            response.message ||
            'ID akun sesuai. Lanjutkan untuk membuat pesanan.',
        });
      } else {
        setValidation({
          valid: false,
          title: 'ID tidak valid',
          message: response.message || 'Periksa kembali ID akun yang kamu isi.',
        });
      }
    } catch (error) {
      setValidation({
        valid: false,
        title: 'Validasi gagal',
        message: getErrorMessage(error),
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async () => {
    setFormError(null);
    setFormErrorCode(undefined);

    const errors: Record<string, string> = {};
    for (const field of fieldDefs) {
      if (field.required !== false && !fields[field.key]?.trim()) {
        errors[field.key] = `${field.label} wajib diisi.`;
      }
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    if (openDenom) {
      if (!qty) {
        setFormError('Masukkan nominal yang ingin dibeli.');
        return;
      }
      if (minQty && qty < minQty) {
        setFormError(`Nominal minimal ${formatRupiah(minQty)}.`);
        return;
      }
      if (maxQty && qty > maxQty) {
        setFormError(`Nominal maksimal ${formatRupiah(maxQty)}.`);
        return;
      }
    }

    if (effectivePaymentType === 'balance' && insufficientBalance) {
      setFormError('Saldo tidak mencukupi. Pilih QRIS atau top up dulu.');
      return;
    }

    const payload: CreateOrderPayload = {
      type: 'prepaid',
      product_id: product.id,
      variant_id: String(variant.id),
      fields: buildCleanFields(),
      payment_type: effectivePaymentType,
    };

    setSubmitting(true);
    try {
      const orderKey = await getOrCreateOrderKey(orderFingerprint(payload));
      const response = await createOrder(payload, orderKey.key);
      await releaseOrderKey(orderKey.storageKey);

      const created = response.data;
      await savePaymentInfo({
        orderId: created.order_id,
        qrLink: created.qr_link || created.payment_link || null,
        total: Number(created.total ?? created.amount ?? total) || total,
        uniqueCode: created.unique_code ?? null,
        fee: created.fee ?? null,
        expiresAt: null,
        paymentType: effectivePaymentType,
        createdAt: new Date().toISOString(),
      });

      void queryClient.invalidateQueries({ queryKey: ['orders'] });
      void queryClient.invalidateQueries({ queryKey: ['balance'] });
      void queryClient.invalidateQueries({ queryKey: ['balance-history'] });
      void queryClient.invalidateQueries({ queryKey: ['me'] });

      router.replace({
        pathname: '/pembayaran/[orderId]',
        params: { orderId: created.order_id },
      });
    } catch (error) {
      setFormError(getErrorMessage(error));
      setFormErrorCode(getErrorCode(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardScreen>
      <Screen padded>
        <AppHeader title="Checkout" subtitle={product.name} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View style={styles.productRow}>
            <View style={styles.productCopy}>
              <AppText variant="labelSmall" color={colors.coralDark}>
                {product.category.toUpperCase()}
              </AppText>
              <AppText variant="titleLarge">{product.name}</AppText>
              <AppText variant="bodySmall" color={colors.muted}>
                {variant.name}
                {server.server_name ? ` · ${server.server_name}` : ''}
              </AppText>
            </View>
            <View style={styles.priceTag}>
              <AppText variant="labelSmall" color={colors.muted}>
                {openDenom ? 'BIAYA' : 'HARGA'}
              </AppText>
              <AppText style={styles.priceTagValue}>
                {formatRupiah(basePrice)}
              </AppText>
            </View>
          </View>

          {formError ? (
            <InfoBanner
              tone="danger"
              title="Pesanan belum dibuat"
              message={formError}
              action={
                formErrorCode === 'PROFILE_INCOMPLETE' ? (
                  <SecondaryButton
                    fullWidth={false}
                    onPress={() => router.push('/profil/edit')}
                  >
                    Lengkapi profil
                  </SecondaryButton>
                ) : undefined
              }
            />
          ) : null}

          <SurfaceCard style={styles.sectionCard}>
            <AppText variant="labelSmall" color={colors.muted} style={styles.eyebrow}>
              01 / TUJUAN
            </AppText>
            <AppText variant="titleLarge">Isi data akun</AppText>
            <AppText variant="bodySmall" color={colors.muted}>
              Pastikan ID dan server benar. Pesanan yang sudah diproses tidak
              dapat dibatalkan.
            </AppText>

            <View style={styles.fields}>
              {fieldDefs.map((field) => (
                <TextField
                  key={field.key}
                  label={field.label}
                  value={fields[field.key] || ''}
                  onChangeText={(value) => updateField(field.key, value)}
                  keyboardType={
                    field.type === 'number' ? 'number-pad' : 'default'
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  errorText={fieldErrors[field.key]}
                  placeholder={field.placeholder}
                  left={
                    <TextInput.Icon
                      icon={
                        field.key === 'zone_id'
                          ? 'server-network-outline'
                          : 'account-outline'
                      }
                      color={colors.muted}
                    />
                  }
                />
              ))}
            </View>

            {variant.validation?.available ? (
              <SecondaryButton
                onPress={() => void handleValidate()}
                loading={validating}
                disabled={validating || submitting}
                icon="account-check-outline"
              >
                Cek ID akun
              </SecondaryButton>
            ) : null}

            {validation ? (
              <InfoBanner
                tone={validation.valid ? 'success' : 'danger'}
                title={validation.title}
                message={validation.message}
              />
            ) : null}
          </SurfaceCard>

          {openDenom ? (
            <SurfaceCard style={styles.sectionCard}>
              <AppText variant="labelSmall" color={colors.muted} style={styles.eyebrow}>
                02 / NOMINAL
              </AppText>
              <AppText variant="titleLarge">Masukkan nominal</AppText>
              <TextField
                label="Nominal"
                value={providerQty}
                onChangeText={(value) =>
                  setProviderQty(value.replace(/\D/g, '').slice(0, 9))
                }
                keyboardType="number-pad"
                left={<TextInput.Icon icon="cash" color={colors.muted} />}
                hint={
                  minQty || maxQty
                    ? `Rentang ${formatRupiah(minQty)} – ${formatRupiah(maxQty)}`
                    : 'Masukkan nominal sesuai kebutuhan.'
                }
              />
              <AppText variant="bodySmall" color={colors.muted}>
                Total dibayar = nominal + biaya layanan {formatRupiah(basePrice)}.
              </AppText>
            </SurfaceCard>
          ) : null}

          <SurfaceCard style={styles.sectionCard}>
            <AppText variant="labelSmall" color={colors.muted} style={styles.eyebrow}>
              {openDenom ? '03 / PEMBAYARAN' : '02 / PEMBAYARAN'}
            </AppText>
            <AppText variant="titleLarge">Pilih metode bayar</AppText>

            <PaymentOption
              title="Saldo Noxarianet"
              description={
                balanceLoading
                  ? 'Memuat saldo…'
                  : `Tersedia ${formatRupiah(balance)}`
              }
              selected={effectivePaymentType === 'balance'}
              disabled={balanceLoading || insufficientBalance}
              warning={
                !balanceLoading && insufficientBalance
                  ? 'Saldo tidak cukup'
                  : undefined
              }
              onPress={() => setPaymentType('balance')}
              icon="wallet-outline"
            />
            <PaymentOption
              title="QRIS"
              description="Scan QR dengan bank atau e-wallet apa pun"
              selected={effectivePaymentType === 'gateway'}
              onPress={() => setPaymentType('gateway')}
              icon="qrcode-scan"
              badge="Instan"
            />

            {effectivePaymentType === 'balance' && insufficientBalance ? (
              <InfoBanner
                tone="warning"
                title="Saldo kurang"
                message="Top up saldo terlebih dahulu atau pilih pembayaran QRIS."
              />
            ) : null}
          </SurfaceCard>

          <SurfaceCard style={styles.sectionCard}>
            <AppText variant="labelSmall" color={colors.muted} style={styles.eyebrow}>
              RINGKASAN
            </AppText>
            <ReceiptRow label="Produk" value={product.name} />
            <ReceiptRow label="Nominal" value={variant.name} />
            {targetKey && fields[targetKey] ? (
              <ReceiptRow label="Tujuan" value={fields[targetKey]} mono />
            ) : null}
            {openDenom ? (
              <ReceiptRow label="Nominal beli" value={formatRupiah(qty)} />
            ) : null}
            <View style={styles.summaryDivider} />
            <ReceiptRow
              label="Total"
              value={
                openDenom && !qty ? 'Isi nominal' : formatRupiah(total)
              }
              strong
              valueColor={colors.coralDark}
            />
            {effectivePaymentType === 'gateway' ? (
              <AppText variant="bodySmall" color={colors.muted}>
                Kode unik atau biaya gateway dapat ditambahkan pada invoice QRIS.
              </AppText>
            ) : null}
          </SurfaceCard>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
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
              {openDenom && !qty ? 'Isi nominal' : formatRupiah(total)}
            </AppText>
          </View>
          <PrimaryButton
            fullWidth={false}
            onPress={() => void handleSubmit()}
            loading={submitting}
            disabled={
              submitting ||
              validating ||
              (effectivePaymentType === 'balance' && balanceLoading) ||
              (!openDenom && !fieldDefs.length)
            }
            style={styles.submit}
          >
            Buat pesanan
          </PrimaryButton>
        </View>
      </Screen>
    </KeyboardScreen>
  );
}

function PaymentOption({
  title,
  description,
  selected,
  onPress,
  icon,
  badge,
  warning,
  disabled,
}: {
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  icon: 'wallet-outline' | 'qrcode-scan';
  badge?: string;
  warning?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        styles.payment,
        selected && styles.paymentSelected,
        disabled && styles.paymentDisabled,
        pressed && !disabled ? styles.paymentPressed : null,
      ]}
    >
      <View style={styles.paymentIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={colors.coralDark}
        />
      </View>
      <View style={styles.paymentCopy}>
        <View style={styles.paymentTitleRow}>
          <AppText variant="titleMedium">{title}</AppText>
          {badge ? (
            <View style={styles.paymentBadge}>
              <AppText variant="labelSmall" color={colors.tealInk}>
                {badge.toUpperCase()}
              </AppText>
            </View>
          ) : null}
        </View>
        <AppText
          variant="bodySmall"
          color={warning ? colors.danger : colors.muted}
        >
          {warning || description}
        </AppText>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.lg,
    gap: spacing.base,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.base,
    marginTop: spacing.xs,
  },
  productCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  priceTag: {
    alignItems: 'flex-end',
    gap: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexShrink: 0,
  },
  priceTagValue: {
    fontFamily: fonts.monoMedium,
    fontSize: 14,
  },
  sectionCard: {
    gap: spacing.md,
  },
  eyebrow: {
    letterSpacing: 1.2,
  },
  fields: {
    gap: spacing.md,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
    marginVertical: spacing.xs,
  },
  payment: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  paymentSelected: {
    borderColor: colors.coral,
    backgroundColor: colors.coralSoft,
  },
  paymentDisabled: {
    opacity: 0.6,
  },
  paymentPressed: {
    opacity: 0.75,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  paymentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  paymentBadge: {
    backgroundColor: colors.tealSoft,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioSelected: {
    borderColor: colors.coralDark,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.coralDark,
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
