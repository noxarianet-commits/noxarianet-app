import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal } from 'react-native-paper';

import type { HomeCategory } from '@/api/types';
import { useAuth } from '@/auth/AuthProvider';
import { ProductCard } from '@/components/product/ProductCard';
import { AppLogo } from '@/components/ui/AppLogo';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { InfoBanner } from '@/components/ui/InfoBanner';
import { RemoteArtwork } from '@/components/ui/RemoteArtwork';
import { ScreenScroll } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { BalanceCard } from '@/components/wallet/BalanceCard';
import { useBalance } from '@/hooks/useBalance';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useHome } from '@/hooks/useHome';
import { useMe } from '@/hooks/useMe';
import { firstName } from '@/lib/format';
import { normalizeSiteContent } from '@/lib/settings';
import { dismissInfoModal, shouldShowInfoModal } from '@/lib/storage';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const QUICK_ACTIONS: {
  key: string;
  label: string;
  icon: IconName;
  to:
    | { pathname: '/topup' }
    | { pathname: '/(tabs)/katalog'; params: { type: string } }
    | { pathname: '/(tabs)/pesanan' }
    | { pathname: '/bantuan' };
}[] = [
  { key: 'topup', label: 'Top up', icon: 'wallet-plus-outline', to: { pathname: '/topup' } },
  {
    key: 'bills',
    label: 'Tagihan',
    icon: 'receipt-text-outline',
    to: { pathname: '/(tabs)/katalog', params: { type: 'postpaid' } },
  },
  {
    key: 'orders',
    label: 'Pesanan',
    icon: 'receipt-text-outline',
    to: { pathname: '/(tabs)/pesanan' },
  },
  { key: 'support', label: 'Bantuan', icon: 'whatsapp', to: { pathname: '/bantuan' } },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const meQuery = useMe();
  const balanceQuery = useBalance();
  const homeQuery = useHome();
  const configQuery = useAppConfig();

  const [infoVisible, setInfoVisible] = useState(false);

  const profile = meQuery.data ?? user;
  const home = homeQuery.data;
  const settings = home?.settings;
  const site = normalizeSiteContent(settings?.site_content);
  const billsEnabled = configQuery.data?.features?.bills !== false;
  const categories = home?.prepaid_categories?.length
    ? home.prepaid_categories
    : home?.categories?.filter((category) => category.type !== 'postpaid') ?? [];
  const billCategories = billsEnabled
    ? home?.bill_categories?.length
      ? home.bill_categories
      : home?.categories?.filter((category) => category.type === 'postpaid') ?? []
    : [];
  const featured = (home?.featured_products ?? []).filter(
    (product) => !product.is_postpaid && product.product_type !== 'postpaid',
  );
  const testimonials = home?.testimonials ?? [];
  const shopClosed = settings?.shop_status?.isOpen === false;

  useEffect(() => {
    if (!settings?.info_modal_active || !settings.info_modal_text) return;
    let active = true;

    void shouldShowInfoModal().then((show) => {
      if (active && show) setInfoVisible(true);
    });

    return () => {
      active = false;
    };
  }, [settings?.info_modal_active, settings?.info_modal_text]);

  const dismissInfo = () => {
    setInfoVisible(false);
    void dismissInfoModal();
  };

  const refresh = () => {
    void homeQuery.refetch();
    void balanceQuery.refetch();
    void meQuery.refetch();
  };

  const refreshing =
    homeQuery.isRefetching ||
    balanceQuery.isRefetching ||
    meQuery.isRefetching;

  if (homeQuery.isPending) {
    return (
      <ScreenScroll>
        <HomeTopBar name={profile?.display_name} />
        <LoadingState label="Menyiapkan beranda…" />
      </ScreenScroll>
    );
  }

  if (homeQuery.isError && !homeQuery.data) {
    return (
      <ScreenScroll>
        <HomeTopBar name={profile?.display_name} />
        <ErrorState
          error={homeQuery.error}
          title="Beranda belum bisa dimuat"
          onRetry={refresh}
        />
      </ScreenScroll>
    );
  }

  return (
    <>
      <ScreenScroll refreshing={refreshing} onRefresh={refresh}>
        <HomeTopBar name={profile?.display_name} />

        <View style={styles.greeting}>
          <AppText variant="labelSmall" color={colors.coralDark}>
            HALO, {firstName(profile?.display_name).toUpperCase()}
          </AppText>
          <AppText variant="headlineLarge">{site.heroTitle}</AppText>
          <AppText variant="bodyMedium" color={colors.muted}>
            {site.heroSubtitle}
          </AppText>
        </View>

        {shopClosed ? (
          <InfoBanner
            tone="warning"
            title="Toko sedang tutup"
            message={
              settings?.shop_status?.message ||
              'Pesanan baru belum bisa diproses saat ini.'
            }
            style={styles.banner}
          />
        ) : null}

        <BalanceCard
          balance={balanceQuery.data?.balance ?? profile?.balance ?? 0}
          limit={balanceQuery.data?.balance_limit ?? profile?.balance_limit}
          onTopup={() => router.push('/topup')}
          onHistory={() => router.push('/saldo/riwayat')}
        />

        <View style={styles.quickRow}>
          {QUICK_ACTIONS.filter(
            (action) => billsEnabled || action.key !== 'bills',
          ).map((action) => (
            <Pressable
              key={action.key}
              onPress={() => router.push(action.to)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.quickCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.quickIcon}>
                <MaterialCommunityIcons
                  name={action.icon}
                  size={21}
                  color={colors.coralDark}
                />
              </View>
              <AppText variant="labelMedium" color={colors.ink}>
                {action.label}
              </AppText>
            </Pressable>
          ))}
        </View>

        {categories.length ? (
          <View style={styles.section}>
            <SectionHeader
              eyebrow="Jelajahi"
              title="Kategori"
              actionLabel="Semua"
              onAction={() => router.push('/(tabs)/katalog')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {categories.map((category) => (
                <CategoryCard
                  key={category.slug || category.name}
                  category={category}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/katalog',
                      params: { category: category.name },
                    })
                  }
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {billCategories.length ? (
          <View style={styles.section}>
            <SectionHeader
              eyebrow="Bayar tagihan"
              title="Kategori tagihan"
              actionLabel="Semua"
              onAction={() =>
                router.push({
                  pathname: '/(tabs)/katalog',
                  params: { type: 'postpaid' },
                })
              }
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {billCategories.map((category) => (
                <BillCategoryCard
                  key={category.slug || category.name}
                  category={category}
                  onPress={() =>
                    router.push({
                      pathname: '/(tabs)/katalog',
                      params: { type: 'postpaid', category: category.name },
                    })
                  }
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeader
            eyebrow="Paling dicari"
            title="Pilihan cepat"
            actionLabel="Lihat semua"
            onAction={() => router.push('/(tabs)/katalog')}
          />
          {featured.length ? (
            <View style={styles.grid}>
              {featured.slice(0, 6).map((product) => (
                <View key={`${product.vendor}-${product.id}`} style={styles.gridItem}>
                  <ProductCard
                    product={product}
                    serverCount={product.servers?.length}
                    onPress={() =>
                      router.push({
                        pathname: '/produk/[id]',
                        params: { id: String(product.id) },
                      })
                    }
                  />
                </View>
              ))}
            </View>
          ) : (
            <InfoBanner
              tone="info"
              title="Katalog sedang disiapkan"
              message="Produk akan muncul di sini setelah sinkronisasi selesai."
            />
          )}
        </View>

        {testimonials.length ? (
          <View style={styles.section}>
            <SectionHeader eyebrow="Cerita pembeli" title="Kata mereka" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.testimonialRow}
            >
              {testimonials.slice(0, 8).map((testimonial) => (
                <View key={testimonial.id} style={styles.testimonialCard}>
                  <View style={styles.stars}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <MaterialCommunityIcons
                        key={index}
                        name={index < testimonial.rating ? 'star' : 'star-outline'}
                        size={13}
                        color={colors.gold}
                      />
                    ))}
                  </View>
                  <AppText variant="bodyMedium" style={styles.testimonialText}>
                    “{testimonial.text}”
                  </AppText>
                  <AppText variant="labelSmall" color={colors.muted}>
                    {testimonial.name.toUpperCase()}
                  </AppText>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.supportCard}>
          <View style={styles.supportCopy}>
            <AppText variant="titleMedium">Butuh bantuan?</AppText>
            <AppText variant="bodySmall" color={colors.muted}>
              Tim CS siap membantu lewat WhatsApp.
            </AppText>
          </View>
          <Pressable
            onPress={() => router.push('/bantuan')}
            style={({ pressed }) => [
              styles.supportButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name="whatsapp"
              size={18}
              color={colors.surface}
            />
            <AppText variant="labelMedium" style={styles.supportLabel}>
              Hubungi
            </AppText>
          </Pressable>
        </View>

        <AppText variant="bodySmall" color={colors.muted} align="center" style={styles.footer}>
          Noxarianet Store · produk digital & top up
        </AppText>
      </ScreenScroll>

      <Portal>
        <Dialog
          visible={infoVisible}
          onDismiss={dismissInfo}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Informasi</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            {settings?.info_modal_image ? (
              <Image
                source={{ uri: settings.info_modal_image }}
                style={styles.dialogImage}
                contentFit="cover"
              />
            ) : null}
            <AppText variant="bodyMedium" color={colors.muted}>
              {settings?.info_modal_text}
            </AppText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={dismissInfo}
              uppercase={false}
              textColor={colors.coralDark}
              labelStyle={{ fontFamily: fonts.semiBold }}
            >
              Mengerti
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

function HomeTopBar({ name }: { name?: string | null }) {
  return (
    <View style={styles.topBar}>
      <AppLogo size={38} />
      <View style={styles.brand}>
        <AppText variant="labelSmall" style={styles.brandName}>
          NOXARIANET
        </AppText>
        <AppText variant="bodySmall" color={colors.muted} style={styles.brandSub}>
          STORE
        </AppText>
      </View>
      <Pressable
        onPress={() => router.push('/(tabs)/akun')}
        style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Buka akun"
      >
        <Avatar name={name} size={38} />
      </Pressable>
    </View>
  );
}

function BillCategoryCard({
  category,
  onPress,
}: {
  category: HomeCategory;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.billCard, pressed && styles.pressed]}
    >
      <View style={styles.billIcon}>
        <MaterialCommunityIcons
          name="receipt-text-outline"
          size={20}
          color={colors.teal}
        />
      </View>
      <View style={styles.billCopy}>
        <AppText variant="titleSmall" numberOfLines={2}>
          {category.name}
        </AppText>
        <AppText variant="bodySmall" color={colors.muted}>
          {category.product_count} tagihan
        </AppText>
      </View>
    </Pressable>
  );
}

function CategoryCard({
  category,
  onPress,
}: {
  category: HomeCategory;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.categoryCard, pressed && styles.pressed]}
    >
      <View style={styles.categoryIcon}>
        <RemoteArtwork
          uri={category.icon}
          label={category.name}
          size={34}
          cornerRadius={0}
          style={styles.categoryImage}
        />
      </View>
      <AppText variant="titleSmall" numberOfLines={2} style={styles.categoryName}>
        {category.name}
      </AppText>
      <AppText variant="bodySmall" color={colors.muted}>
        {category.product_count} produk
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  brand: {
    flex: 1,
  },
  brandName: {
    letterSpacing: 2.2,
    fontFamily: fonts.monoMedium,
  },
  brandSub: {
    letterSpacing: 4.2,
    fontFamily: fonts.mono,
    marginTop: -2,
  },
  avatarButton: {
    padding: 2,
  },
  greeting: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  banner: {
    marginTop: spacing.base,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  quickCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.coralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  section: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  categoryRow: {
    gap: spacing.sm,
    paddingRight: spacing.base,
  },
  categoryCard: {
    width: 108,
    minHeight: 132,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.xs,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  categoryImage: {
    width: 34,
    height: 34,
  },
  categoryName: {
    minHeight: 36,
  },
  billCard: {
    width: 168,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.tealSoft,
    borderWidth: 1,
    borderColor: '#C4E2D8',
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  billIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billCopy: {
    flex: 1,
    gap: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing.sm,
  },
  gridItem: {
    width: '48.2%',
  },
  testimonialRow: {
    gap: spacing.sm,
    paddingRight: spacing.base,
  },
  testimonialCard: {
    width: 260,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    padding: spacing.base,
    gap: spacing.sm,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  testimonialText: {
    fontFamily: fonts.regular,
    lineHeight: 22,
  },
  supportCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.tealSoft,
    borderWidth: 1,
    borderColor: '#C4E2D8',
    borderRadius: radius.sm,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  supportCopy: {
    flex: 1,
    gap: 2,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.teal,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    minHeight: 40,
  },
  supportLabel: {
    color: colors.surface,
    fontFamily: fonts.semiBold,
  },
  footer: {
    marginTop: spacing.lg,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  dialogTitle: {
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  dialogContent: {
    gap: spacing.md,
  },
  dialogImage: {
    width: '100%',
    height: 160,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
});
