import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/Buttons';
import { InfoBanner } from '@/components/ui/InfoBanner';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { UnderlineTabs } from '@/components/ui/Tabs';
import { ProductArtwork } from '@/components/product/ProductArtwork';
import { VariantRow } from '@/components/product/VariantRow';
import { useProduct } from '@/hooks/useProduct';
import { formatRupiah } from '@/lib/format';
import {
  billVariantFee,
  getBillVariants,
  getProductServers,
  getServerVariants,
  isOpenDenom,
  isPostpaidProduct,
  vendorLabel,
} from '@/lib/products';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

export default function ProductDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const productQuery = useProduct(params.id);
  const insets = useSafeAreaInsets();

  const [serverIndex, setServerIndex] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(null);

  const product = productQuery.data;
  const isPostpaid = isPostpaidProduct(product);

  const servers = useMemo(
    () => (product && !isPostpaid ? getProductServers(product) : []),
    [product, isPostpaid],
  );

  const server = servers[Math.min(serverIndex, Math.max(servers.length - 1, 0))];

  const variants = useMemo(() => {
    if (!product) return [];
    if (isPostpaid) return getBillVariants(product);
    return server ? getServerVariants(server) : [];
  }, [product, isPostpaid, server]);

  const selectedVariant =
    variants.find((variant) => String(variant.id) === variantId) ||
    variants[0];
  const activeVariantId = selectedVariant ? String(selectedVariant.id) : null;

  const serverItems = useMemo(
    () =>
      servers.map((item) => ({
        key: item.vendor,
        label: item.server_name || vendorLabel(item.vendor),
      })),
    [servers],
  );

  const goToCheckout = () => {
    if (!product || !server || !selectedVariant || isPostpaid) return;
    router.push({
      pathname: '/checkout/[productId]',
      params: {
        productId: String(server.product_id),
        variantId: String(selectedVariant.id),
        vendor: server.vendor,
      },
    });
  };

  const goToBill = () => {
    if (!product || !selectedVariant) return;
    router.push({
      pathname: '/tagihan/[productId]',
      params: {
        productId: String(product.id),
        variantId: String(selectedVariant.id),
      },
    });
  };

  if (productQuery.isPending) {
    return (
      <Screen>
        <AppHeader title="Detail produk" />
        <LoadingState label="Memuat produk…" />
      </Screen>
    );
  }

  if (!product || (!isPostpaid && !server)) {
    return (
      <Screen>
        <AppHeader title="Detail produk" />
        <ErrorState
          error={productQuery.error}
          title="Produk tidak bisa dibuka"
          onRetry={() => void productQuery.refetch()}
        />
      </Screen>
    );
  }

  const steps = isPostpaid
    ? ([
        { icon: 'format-list-bulleted', label: 'Pilih jenis' },
        { icon: 'magnify', label: 'Cek tagihan' },
        { icon: 'wallet-outline', label: 'Bayar saldo' },
      ] as const)
    : ([
        { icon: 'numeric-1-circle-outline', label: 'Pilih nominal' },
        { icon: 'account-check-outline', label: 'Isi ID akun' },
        { icon: 'qrcode-scan', label: 'Bayar & selesai' },
      ] as const);

  return (
    <Screen padded>
      <AppHeader title="Detail produk" subtitle={product.category} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <View style={styles.media}>
            <ProductArtwork product={product} size={78} />
          </View>
          <View style={styles.heroCopy}>
            <View style={styles.brandRow}>
              <AppText variant="labelSmall" color={colors.coralDark}>
                {product.category.toUpperCase()}
              </AppText>
              {isPostpaid ? (
                <View style={styles.serverBadge}>
                  <MaterialCommunityIcons
                    name="receipt-text-outline"
                    size={11}
                    color={colors.coralInk}
                  />
                  <AppText variant="labelSmall" color={colors.coralInk}>
                    TAGIHAN
                  </AppText>
                </View>
              ) : servers.length > 1 ? (
                <View style={styles.serverBadge}>
                  <MaterialCommunityIcons
                    name="server-network"
                    size={11}
                    color={colors.coralInk}
                  />
                  <AppText variant="labelSmall" color={colors.coralInk}>
                    {servers.length} SERVER
                  </AppText>
                </View>
              ) : null}
            </View>
            <AppText variant="headlineMedium">{product.name}</AppText>
            {product.brand ? (
              <AppText variant="bodySmall" color={colors.muted}>
                {product.brand}
              </AppText>
            ) : null}
          </View>
        </View>

        <View style={styles.steps}>
          {steps.map((step) => (
            <View key={step.icon} style={styles.step}>
              <MaterialCommunityIcons
                name={step.icon}
                size={17}
                color={colors.teal}
              />
              <AppText variant="bodySmall" color={colors.muted}>
                {step.label}
              </AppText>
            </View>
          ))}
        </View>

        {isPostpaid ? (
          <>
            <InfoBanner
              tone="info"
              title="Nominal ditentukan vendor"
              message="Masukkan nomor pelanggan atau ID meter untuk melihat nominal tagihan. Nominal tidak bisa diubah manual."
            />

            <View style={styles.section}>
              <SectionHeader
                eyebrow="Jenis tagihan"
                title="Pilih kategori"
                actionLabel={`${variants.length} pilihan`}
              />
              <View style={styles.variantList}>
                {variants.length ? (
                  variants.map((variant) => (
                    <VariantRow
                      key={`bill-${variant.id}`}
                      variant={variant}
                      selected={String(variant.id) === activeVariantId}
                      onPress={() => setVariantId(String(variant.id))}
                    />
                  ))
                ) : (
                  <InfoBanner
                    tone="warning"
                    title="Belum ada pilihan"
                    message="Belum ada jenis tagihan yang aktif untuk produk ini."
                  />
                )}
              </View>
            </View>
          </>
        ) : (
          <>
            {servers.length > 1 ? (
              <View style={styles.serverTabs}>
                <UnderlineTabs
                  items={serverItems}
                  value={server.vendor}
                  onChange={(key) => {
                    const index = servers.findIndex(
                      (item) => item.vendor === key,
                    );
                    if (index >= 0) {
                      setServerIndex(index);
                      setVariantId(null);
                    }
                  }}
                />
              </View>
            ) : (
              <View style={styles.singleServer}>
                <MaterialCommunityIcons
                  name="server-network"
                  size={15}
                  color={colors.muted}
                />
                <AppText variant="bodySmall" color={colors.muted}>
                  {server.server_name || vendorLabel(server.vendor)}
                </AppText>
              </View>
            )}

            <View style={styles.section}>
              <SectionHeader
                eyebrow="Nominal"
                title="Pilih produk"
                actionLabel={`${variants.length} pilihan`}
              />
              <View style={styles.variantList}>
                {variants.length ? (
                  variants.map((variant) => (
                    <VariantRow
                      key={`${server.vendor}-${variant.id}`}
                      variant={variant}
                      selected={String(variant.id) === activeVariantId}
                      onPress={() => setVariantId(String(variant.id))}
                    />
                  ))
                ) : (
                  <InfoBanner
                    tone="warning"
                    title="Stok kosong"
                    message="Belum ada nominal yang tersedia di server ini. Coba pilih server lain."
                  />
                )}
              </View>
            </View>

            {selectedVariant?.note ? (
              <InfoBanner
                tone="info"
                title="Catatan produk"
                message={selectedVariant.note}
              />
            ) : null}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.footerPrice}>
          <AppText variant="labelSmall" color={colors.muted}>
            {isPostpaid
              ? 'BIAYA LAYANAN'
              : isOpenDenom(selectedVariant)
                ? 'NOMINAL BEBAS'
                : 'HARGA'}
          </AppText>
          <AppText style={styles.priceValue}>
            {isPostpaid
              ? billVariantFee(selectedVariant) > 0
                ? formatRupiah(billVariantFee(selectedVariant))
                : 'Tanpa biaya'
              : isOpenDenom(selectedVariant)
                ? 'Ditentukan nanti'
                : selectedVariant
                  ? formatRupiah(selectedVariant.price)
                  : '—'}
          </AppText>
        </View>
        <PrimaryButton
          fullWidth={false}
          disabled={!selectedVariant}
          onPress={isPostpaid ? goToBill : goToCheckout}
          style={styles.cta}
        >
          {isPostpaid ? 'Cek tagihan' : 'Lanjut'}
        </PrimaryButton>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
    gap: spacing.base,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    marginTop: spacing.xs,
  },
  media: {
    width: 92,
    height: 92,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroCopy: {
    flex: 1,
    gap: 3,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  serverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.coralSoft,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  step: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  serverTabs: {
    marginTop: spacing.xs,
  },
  singleServer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
  variantList: {
    gap: spacing.sm,
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
  footerPrice: {
    flex: 1,
    gap: 1,
  },
  priceValue: {
    fontFamily: fonts.monoMedium,
    fontSize: 17,
    color: colors.ink,
  },
  cta: {
    minWidth: 140,
  },
});
