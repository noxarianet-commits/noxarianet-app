import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { ScreenScroll } from '@/components/ui/Screen';
import { EmptyState } from '@/components/ui/States';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { FilterChips } from '@/components/ui/Tabs';
import { useSafeBack } from '@/hooks/useBackHandler';
import { useHome } from '@/hooks/useHome';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

export type InfoCategory = 'ALL' | 'PENGUMUMAN' | 'PROMO' | 'SISTEM' | 'TRANSAKSI';

export type InformationItem = {
  id: string;
  category: 'PENGUMUMAN' | 'PROMO' | 'SISTEM' | 'TRANSAKSI';
  categoryLabel: string;
  title: string;
  content: string;
  date?: string;
  isImportant?: boolean;
  image?: string | null;
  actionLabel?: string;
  actionRoute?: string;
};

const CATEGORY_CHIPS = [
  { key: 'ALL', label: 'Semua' },
  { key: 'PENGUMUMAN', label: 'Pengumuman' },
  { key: 'PROMO', label: 'Promo' },
  { key: 'SISTEM', label: 'Sistem' },
  { key: 'TRANSAKSI', label: 'Panduan' },
] as const;

export default function InformationScreen() {
  useSafeBack('/(tabs)');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const homeQuery = useHome();
  const settings = homeQuery.data?.settings;

  const handleCopy = async (item: InformationItem) => {
    try {
      const textToCopy = `${item.title}\n\n${item.content}`;
      await Clipboard.setStringAsync(textToCopy);
      setCopiedId(item.id);
      Alert.alert('Tersalin', 'Isi pengumuman berhasil disalin ke papan klip!', [
        { text: 'OK' },
      ]);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Ignore
    }
  };

  // Build the categorized list of information items
  const allItems = useMemo<InformationItem[]>(() => {
    const list: InformationItem[] = [];

    // 1. Live Admin Announcement (from backend settings)
    if (settings?.info_modal_text) {
      list.push({
        id: 'admin-broadcast',
        category: 'PENGUMUMAN',
        categoryLabel: 'PENGUMUMAN',
        title: 'Pengumuman Resmi Noxarianet',
        content: settings.info_modal_text,
        image: settings.info_modal_image,
        isImportant: true,
        date: 'Terbaru',
      });
    }

    // 2. Shop Operational Status
    if (settings?.shop_status?.isOpen === false) {
      list.push({
        id: 'shop-status-notice',
        category: 'SISTEM',
        categoryLabel: 'SISTEM',
        title: 'Status Jam Operasional Toko',
        content:
          settings.shop_status.message ||
          'Toko sedang tutup sementara. Pesanan baru akan segera diproses saat toko aktif kembali.',
        isImportant: true,
        date: 'Sistem',
      });
    }

    // 3. Security Warning
    list.push({
      id: 'security-notice',
      category: 'PENGUMUMAN',
      categoryLabel: 'PENGUMUMAN',
      title: 'Waspada Penipuan & Keamanan Akun',
      content:
        'Customer Service Noxarianet tidak pernah meminta password, PIN, atau kode OTP akunmu. Hubungi CS resmi hanya melalui nomor WhatsApp terverifikasi.',
      isImportant: true,
      date: 'Keamanan',
      actionLabel: 'Pusat Bantuan CS',
      actionRoute: '/bantuan',
    });

    // 4. Payment Guide (QRIS & Saldo)
    list.push({
      id: 'payment-methods-guide',
      category: 'TRANSAKSI',
      categoryLabel: 'PANDUAN',
      title: 'Metode Pembayaran QRIS & Saldo Noxarianet',
      content:
        'Noxarianet mendukung pembayaran otomatis menggunakan Saldo Noxarianet (proses instan tanpa biaya admin) dan QRIS Realtime yang dapat discan oleh seluruh aplikasi bank dan e-wallet di Indonesia.',
      date: 'Panduan',
      actionLabel: 'Top Up Saldo Sekarang',
      actionRoute: '/topup',
    });

    // 5. Promo & Flash Sale
    list.push({
      id: 'promo-flash-sale',
      category: 'PROMO',
      categoryLabel: 'PROMO',
      title: 'Top Up Game & Pulsa Termurah',
      content:
        'Dapatkan harga termurah untuk Mobile Legends, Free Fire, PUBG Mobile, Genshin Impact, hingga Token PLN. Pantau katalog kami untuk update harga promo terbaru.',
      date: 'Promo',
      actionLabel: 'Buka Katalog Produk',
      actionRoute: '/(tabs)/katalog',
    });

    // 6. Automated 24/7 Processing
    list.push({
      id: 'system-automated-247',
      category: 'SISTEM',
      categoryLabel: 'SISTEM',
      title: 'Layanan Otomatis 24 Jam Non-Stop',
      content:
        'Semua transaksi digital di Noxarianet diproses secara otomatis oleh server 24 jam. Kamu dapat memantau status pesanan kapan saja melalui menu Pesanan.',
      date: 'Sistem',
      actionLabel: 'Cek Riwayat Pesanan',
      actionRoute: '/(tabs)/pesanan',
    });

    // 7. CS Support Information
    list.push({
      id: 'support-info',
      category: 'TRANSAKSI',
      categoryLabel: 'PANDUAN',
      title: 'Ada Kendala Transaksi?',
      content:
        'Jika pesanan mengalami keterlambatan atau salah input data ID akun, jangan panik. Sertakan nomor pesanan (format NX-...) dan hubungi Customer Service kami untuk bantuan cepat.',
      date: 'Bantuan',
      actionLabel: 'Hubungi WhatsApp CS',
      actionRoute: '/bantuan',
    });

    return list;
  }, [settings?.info_modal_text, settings?.info_modal_image, settings?.shop_status]);

  // Filter items based on selected category chip
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'ALL') return allItems;
    return allItems.filter((item) => item.category === selectedCategory);
  }, [allItems, selectedCategory]);

  const handleAction = (route?: string) => {
    if (!route) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push(route as any);
  };

  return (
    <ScreenScroll>
      <AppHeader
        title="Pusat Informasi"
        subtitle="Pengumuman & update resmi Noxarianet"
      />

      {/* Filter Kategori Chips */}
      <View style={styles.filterSection}>
        <FilterChips
          items={CATEGORY_CHIPS}
          value={selectedCategory}
          onChange={setSelectedCategory}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        />
      </View>

      {/* Information Cards List */}
      <View style={styles.list}>
        {filteredItems.length ? (
          filteredItems.map((item) => {
            const isImportant = item.isImportant;

            return (
              <SurfaceCard
                key={item.id}
                style={[
                  styles.card,
                  isImportant && styles.cardImportant,
                ]}
              >
                {/* Header Row: Badge & Date */}
                <View style={styles.cardHeader}>
                  <View style={styles.badgesRow}>
                    <View
                      style={[
                        styles.categoryBadge,
                        item.category === 'PENGUMUMAN' && styles.badgeAnnouncement,
                        item.category === 'PROMO' && styles.badgePromo,
                        item.category === 'SISTEM' && styles.badgeSystem,
                        item.category === 'TRANSAKSI' && styles.badgeTransaction,
                      ]}
                    >
                      <AppText
                        variant="labelSmall"
                        style={[
                          styles.categoryBadgeText,
                          item.category === 'PENGUMUMAN' && styles.badgeTextAnnouncement,
                          item.category === 'PROMO' && styles.badgeTextPromo,
                          item.category === 'SISTEM' && styles.badgeTextSystem,
                          item.category === 'TRANSAKSI' && styles.badgeTextTransaction,
                        ]}
                      >
                        {item.categoryLabel}
                      </AppText>
                    </View>

                    {isImportant ? (
                      <View style={styles.importantBadge}>
                        <MaterialCommunityIcons
                          name="alert-circle-outline"
                          size={12}
                          color={colors.danger}
                        />
                        <AppText variant="labelSmall" style={styles.importantText}>
                          PENTING
                        </AppText>
                      </View>
                    ) : null}
                  </View>

                  {item.date ? (
                    <AppText variant="labelSmall" color={colors.muted}>
                      {item.date}
                    </AppText>
                  ) : null}
                </View>

                {/* Optional Announcement Image */}
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.cardImage}
                    contentFit="cover"
                    transition={150}
                  />
                ) : null}

                {/* Card Title */}
                <AppText variant="titleMedium" selectable style={styles.cardTitle}>
                  {item.title}
                </AppText>

                {/* Card Content Description */}
                <AppText variant="bodyMedium" selectable color={colors.inkSoft} style={styles.cardContent}>
                  {item.content}
                </AppText>

                {/* Action Buttons: Copy Text & Optional Route */}
                <View style={styles.cardFooter}>
                  <Pressable
                    onPress={() => void handleCopy(item)}
                    accessibilityRole="button"
                    accessibilityLabel="Salin teks informasi"
                    style={({ pressed }) => [
                      styles.copyBtn,
                      copiedId === item.id && styles.copyBtnSuccess,
                      pressed && styles.pressed,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={copiedId === item.id ? 'check-circle' : 'content-copy'}
                      size={13}
                      color={copiedId === item.id ? '#155724' : colors.coralDark}
                    />
                    <AppText
                      style={[
                        styles.copyBtnText,
                        copiedId === item.id && styles.copyBtnTextSuccess,
                      ]}
                    >
                      {copiedId === item.id ? 'Tersalin!' : 'Salin Teks'}
                    </AppText>
                  </Pressable>

                  {item.actionLabel && item.actionRoute ? (
                    <Pressable
                      onPress={() => handleAction(item.actionRoute)}
                      accessibilityRole="button"
                      style={({ pressed }) => [
                        styles.actionButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <AppText variant="labelMedium" style={styles.actionButtonText}>
                        {item.actionLabel}
                      </AppText>
                      <MaterialCommunityIcons
                        name="arrow-right"
                        size={15}
                        color={colors.coralDark}
                      />
                    </Pressable>
                  ) : null}
                </View>
              </SurfaceCard>
            );
          })
        ) : (
          <EmptyState
            icon="information-outline"
            title="Belum ada informasi"
            description="Tidak ada informasi pada kategori ini saat ini."
          />
        )}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  filterSection: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  filterScroll: {
    marginHorizontal: -spacing.base,
  },
  filterContent: {
    paddingHorizontal: spacing.base,
    gap: spacing.xs,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    borderRadius: radius.md,
    padding: spacing.base,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardImportant: {
    borderColor: colors.coralSoft,
    backgroundColor: '#FAF8FD',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  categoryBadgeText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  badgeAnnouncement: {
    backgroundColor: colors.coralSoft,
  },
  badgeTextAnnouncement: {
    color: colors.coralDark,
  },
  badgePromo: {
    backgroundColor: colors.goldSoft,
  },
  badgeTextPromo: {
    color: colors.goldInk,
  },
  badgeSystem: {
    backgroundColor: colors.tealSoft,
  },
  badgeTextSystem: {
    color: colors.tealInk,
  },
  badgeTransaction: {
    backgroundColor: '#E8F0FE',
  },
  badgeTextTransaction: {
    color: '#1A73E8',
  },
  importantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  importantText: {
    color: colors.danger,
    fontSize: 10,
    fontFamily: fonts.bold,
  },
  cardImage: {
    width: '100%',
    height: 150,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    marginTop: spacing.xxs,
    marginBottom: spacing.xxs,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.ink,
  },
  cardContent: {
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#F3EEFA',
    borderWidth: 1,
    borderColor: '#E1D3F3',
    borderRadius: radius.pill,
  },
  copyBtnSuccess: {
    backgroundColor: '#E8F5E9',
    borderColor: '#A5D6A7',
  },
  copyBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 11.5,
    color: colors.coralDark,
  },
  copyBtnTextSuccess: {
    color: '#155724',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.coralSoft,
    borderRadius: radius.pill,
  },
  actionButtonText: {
    fontFamily: fonts.semiBold,
    color: colors.coralDark,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.75,
  },
});

