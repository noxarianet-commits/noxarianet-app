import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { InfoBanner } from '@/components/ui/InfoBanner';
import { ScreenScroll } from '@/components/ui/Screen';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useHome } from '@/hooks/useHome';
import {
  supportWhatsAppNumber,
  supportWhatsAppUrl,
} from '@/lib/settings';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

export default function SupportScreen() {
  const homeQuery = useHome();
  const settings = homeQuery.data?.settings;
  const whatsappUrl = supportWhatsAppUrl(settings);
  const whatsappNumber = supportWhatsAppNumber(settings);
  const groupUrl = settings?.wa_group_link;

  const openUrl = (url?: string | null) => {
    if (url) void Linking.openURL(url);
  };

  return (
    <ScreenScroll>
      <AppHeader title="Bantuan" />

      <View style={styles.hero}>
        <AppText variant="labelSmall" color={colors.coralDark}>
          PUSAT BANTUAN
        </AppText>
        <AppText variant="headlineLarge">Ada kendala?</AppText>
        <AppText variant="bodyMedium" color={colors.muted}>
          Tim CS Noxarianet siap membantu lewat WhatsApp. Sertakan nomor
          pesanan agar pengecekan lebih cepat.
        </AppText>
      </View>

      {whatsappUrl ? (
        <Pressable
          onPress={() => openUrl(whatsappUrl)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.chatCard, pressed && styles.pressed]}
        >
          <View style={styles.chatIcon}>
            <MaterialCommunityIcons
              name="whatsapp"
              size={28}
              color={colors.surface}
            />
          </View>
          <View style={styles.chatCopy}>
            <AppText variant="titleLarge" style={styles.chatTitle}>
              Chat CS sekarang
            </AppText>
            <AppText variant="bodySmall" style={styles.chatSubtitle}>
              {whatsappNumber ? `+${whatsappNumber}` : 'Buka WhatsApp'}
            </AppText>
          </View>
          <MaterialCommunityIcons
            name="arrow-top-right"
            size={20}
            color={colors.surface}
          />
        </Pressable>
      ) : (
        <InfoBanner
          tone="warning"
          title="Nomor CS belum tersedia"
          message="Admin belum mengatur nomor WhatsApp CS. Coba lagi nanti atau gunakan grup WhatsApp jika tersedia."
        />
      )}

      {groupUrl ? (
        <SurfaceCard padded={false}>
          <Pressable
            onPress={() => openUrl(groupUrl)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <View style={[styles.rowIcon, styles.rowIconTeal]}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={20}
                color={colors.teal}
              />
            </View>
            <View style={styles.rowCopy}>
              <AppText variant="titleMedium">Grup WhatsApp</AppText>
              <AppText variant="bodySmall" color={colors.muted}>
                Pengumuman, promo, dan info gangguan
              </AppText>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.lineStrong}
            />
          </Pressable>
        </SurfaceCard>
      ) : null}

      <SurfaceCard style={styles.card}>
        <AppText variant="labelSmall" color={colors.muted} style={styles.eyebrow}>
          SEBELUM CHAT
        </AppText>
        <AppText variant="titleLarge">Siapkan informasi ini</AppText>

        {[
          {
            icon: 'receipt-text-outline' as const,
            title: 'Nomor pesanan',
            description: 'Formatnya NX-…, ada di halaman detail pesanan.',
          },
          {
            icon: 'account-outline' as const,
            title: 'ID / nomor tujuan',
            description: 'Sebutkan ID akun atau nomor yang dipakai saat order.',
          },
          {
            icon: 'camera-outline' as const,
            title: 'Bukti pembayaran',
            description: 'Screenshot pembayaran QRIS membantu pengecekan.',
          },
        ].map((item) => (
          <View key={item.title} style={styles.tipRow}>
            <View style={styles.tipIcon}>
              <MaterialCommunityIcons
                name={item.icon}
                size={18}
                color={colors.coralDark}
              />
            </View>
            <View style={styles.tipCopy}>
              <AppText variant="titleSmall">{item.title}</AppText>
              <AppText variant="bodySmall" color={colors.muted}>
                {item.description}
              </AppText>
            </View>
          </View>
        ))}
      </SurfaceCard>

      <View style={styles.footer}>
        <MaterialCommunityIcons
          name="shield-check-outline"
          size={16}
          color={colors.muted}
        />
        <AppText variant="bodySmall" color={colors.muted} align="center">
          CS tidak pernah meminta password atau kode OTP akunmu.
        </AppText>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  chatCard: {
    backgroundColor: colors.teal,
    borderRadius: radius.md,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.8,
  },
  chatIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 253, 248, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatCopy: {
    flex: 1,
    gap: 1,
  },
  chatTitle: {
    color: colors.surface,
  },
  chatSubtitle: {
    color: 'rgba(255, 253, 248, 0.8)',
    fontFamily: fonts.monoMedium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.coralSoft,
  },
  rowIconTeal: {
    backgroundColor: colors.tealSoft,
  },
  rowCopy: {
    flex: 1,
    gap: 1,
  },
  card: {
    marginTop: spacing.base,
    gap: spacing.md,
  },
  eyebrow: {
    letterSpacing: 1.2,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  tipIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.coralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipCopy: {
    flex: 1,
    gap: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.lg,
  },
});
