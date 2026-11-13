import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Application from 'expo-application';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ListRow } from '@/components/ui/ListRow';
import { ScreenScroll } from '@/components/ui/Screen';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useTabBackToHome } from '@/hooks/useBackHandler';
import { useHome } from '@/hooks/useHome';
import { useMe } from '@/hooks/useMe';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
  notifyCustomMessage,
} from '@/lib/notifications';
import { supportWhatsAppNumber, supportWhatsAppUrl } from '@/lib/settings';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const meQuery = useMe();
  const homeQuery = useHome();
  const configQuery = useAppConfig();

  useTabBackToHome();

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notifGranted, setNotifGranted] = useState<boolean | null>(null);

  // Check permission status on mount
  useEffect(() => {
    void getNotificationPermissionStatus().then(setNotifGranted);
  }, []);

  const handleToggleNotif = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotifGranted(granted);
    if (granted) {
      notifyCustomMessage(
        'Notifikasi Aktif! 🔔',
        'Aplikasi Noxarianet Store siap mengirimkan pesan transaksi dan pengumuman.',
      );
    }
  }, []);

  const profile = meQuery.data ?? user;
  const settings = homeQuery.data?.settings;
  const billsEnabled = configQuery.data?.features?.bills !== false;
  const supportUrl = supportWhatsAppUrl(settings);
  const supportNumber = supportWhatsAppNumber(settings);
  const version = Application.nativeApplicationVersion || '1.0.0';

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      router.replace('/');
    } finally {
      setLoggingOut(false);
      setLogoutVisible(false);
    }
  };

  const openSupport = () => {
    if (supportUrl) void Linking.openURL(supportUrl);
    else router.push('/bantuan');
  };

  const openGroup = () => {
    const link = settings?.wa_group_link;
    if (link) void Linking.openURL(link);
  };

  return (
    <>
      <ScreenScroll>
        {/* Clean Header */}
        <View style={styles.header}>
          <AppText variant="headlineMedium" style={styles.pageTitle}>
            Profil Saya
          </AppText>
        </View>

        {/* Clean Profile Identity Card */}
        <SurfaceCard style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Avatar name={profile?.display_name} size={58} />
            <View style={styles.profileInfo}>
              <AppText variant="titleMedium" style={styles.profileName} numberOfLines={1}>
                {profile?.display_name || 'Pengguna'}
              </AppText>
              <AppText variant="bodySmall" color={colors.muted} numberOfLines={1}>
                {profile?.email || 'Email belum diatur'}
              </AppText>
              {profile?.phone ? (
                <AppText variant="bodySmall" color={colors.muted} numberOfLines={1}>
                  {profile.phone}
                </AppText>
              ) : null}
            </View>

            <Pressable
              onPress={() => router.push('/profil/edit')}
              style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Edit Profil"
            >
              <MaterialCommunityIcons name="pencil-outline" size={17} color={colors.coral} />
            </Pressable>
          </View>

          {/* Verification Badge */}
          <View style={styles.badgeWrap}>
            <View
              style={[
                styles.badgePill,
                {
                  backgroundColor: profile?.email_verified ? colors.tealSoft : colors.surfaceMuted,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={profile?.email_verified ? 'check-decagram' : 'shield-outline'}
                size={14}
                color={profile?.email_verified ? colors.teal : colors.muted}
              />
              <AppText
                variant="labelSmall"
                style={{
                  fontFamily: fonts.semiBold,
                  color: profile?.email_verified ? colors.tealInk : colors.mutedStrong,
                }}
              >
                {profile?.email_verified ? 'Akun Terverifikasi' : 'Akun Aktif'}
              </AppText>
            </View>
          </View>
        </SurfaceCard>

        {/* Section: Transaksi */}
        <AppText variant="labelSmall" color={colors.muted} style={styles.groupLabel}>
          TRANSAKSI
        </AppText>
        <SurfaceCard padded={false} style={styles.groupCard}>
          <View style={styles.groupInner}>
            <ListRow
              icon="receipt-text-outline"
              title="Pesanan saya"
              description="Status dan bukti semua transaksi"
              onPress={() => router.push('/(tabs)/pesanan')}
              showDivider={billsEnabled}
            />
            {billsEnabled ? (
              <ListRow
                icon="file-document-outline"
                title="Tagihan pascabayar"
                description="Listrik, air, BPJS, dan lainnya"
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/katalog',
                    params: { type: 'postpaid' },
                  })
                }
                showDivider={false}
              />
            ) : null}
          </View>
        </SurfaceCard>

        {/* Section: Keamanan */}
        <AppText variant="labelSmall" color={colors.muted} style={styles.groupLabel}>
          KEAMANAN AKUN
        </AppText>
        <SurfaceCard padded={false} style={styles.groupCard}>
          <View style={styles.groupInner}>
            <ListRow
              icon="account-edit-outline"
              title="Edit profil"
              description="Perbarui nama dan nomor WhatsApp"
              onPress={() => router.push('/profil/edit')}
            />
            <ListRow
              icon="lock-reset"
              title="Ubah kata sandi"
              description="Perbarui kata sandi akun"
              onPress={() => router.push('/profil/password')}
              showDivider={false}
            />
          </View>
        </SurfaceCard>

        {/* Section: Pengaturan Aplikasi */}
        <AppText variant="labelSmall" color={colors.muted} style={styles.groupLabel}>
          PENGATURAN
        </AppText>
        <SurfaceCard padded={false} style={styles.groupCard}>
          <View style={styles.groupInner}>
            <ListRow
              icon="bell-ring-outline"
              title="Notifikasi Aplikasi"
              description={
                notifGranted === null
                  ? 'Memeriksa...'
                  : notifGranted
                    ? 'Notifikasi aktif'
                    : 'Ketuk untuk mengaktifkan notifikasi'
              }
              onPress={() => void handleToggleNotif()}
              showDivider={false}
            />
          </View>
        </SurfaceCard>

        {/* Section: Bantuan */}
        <AppText variant="labelSmall" color={colors.muted} style={styles.groupLabel}>
          PUSAT BANTUAN
        </AppText>
        <SurfaceCard padded={false} style={styles.groupCard}>
          <View style={styles.groupInner}>
            <ListRow
              icon="whatsapp"
              tone="teal"
              title="Chat Customer Service"
              description={supportNumber ? `+${supportNumber}` : 'Bantuan responsif via WhatsApp'}
              onPress={openSupport}
              showDivider={!!settings?.wa_group_link}
            />
            {settings?.wa_group_link ? (
              <ListRow
                icon="account-group-outline"
                tone="teal"
                title="Grup Komunitas WhatsApp"
                description="Info promo dan info penting terbaru"
                onPress={openGroup}
                showDivider={false}
              />
            ) : null}
          </View>
        </SurfaceCard>

        {/* Logout Button */}
        <SurfaceCard padded={false} style={styles.logoutCard}>
          <View style={styles.groupInner}>
            <ListRow
              icon="logout"
              tone="danger"
              title="Keluar dari Akun"
              description="Akhiri sesi login di perangkat ini"
              onPress={() => setLogoutVisible(true)}
              showDivider={false}
            />
          </View>
        </SurfaceCard>

        {/* Minimal Footer */}
        <View style={styles.footer}>
          <AppText variant="labelSmall" color={colors.muted} style={styles.footerBrand}>
            NOXARIANET STORE
          </AppText>
          <AppText variant="bodySmall" color={colors.muted} align="center">
            Versi {version}
          </AppText>
        </View>
      </ScreenScroll>

      <ConfirmDialog
        visible={logoutVisible}
        title="Keluar dari akun?"
        message="Kamu perlu masuk kembali dengan email dan kata sandi untuk mengakses akun."
        confirmLabel="Keluar"
        destructive
        loading={loggingOut}
        onConfirm={() => void handleLogout()}
        onDismiss={() => setLogoutVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  pageTitle: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.ink,
  },
  profileCard: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.line,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  profileName: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.ink,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.coralSoft,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  badgeWrap: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
  },

  // Settings Groups
  groupLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    marginLeft: 2,
    letterSpacing: 1.2,
    fontFamily: fonts.semiBold,
    fontSize: 11,
  },
  groupCard: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
  },
  groupInner: {
    paddingHorizontal: spacing.base,
  },
  logoutCard: {
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    borderColor: 'rgba(229, 57, 53, 0.25)',
  },
  footer: {
    marginTop: spacing.xl,
    marginBottom: spacing.base,
    alignItems: 'center',
    gap: 2,
  },
  footerBrand: {
    letterSpacing: 1.5,
    fontFamily: fonts.semiBold,
  },
  pressed: {
    opacity: 0.75,
  },
});
