import * as Application from 'expo-application';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ListRow } from '@/components/ui/ListRow';
import { ScreenScroll } from '@/components/ui/Screen';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { BalanceCard } from '@/components/wallet/BalanceCard';
import { useBalance } from '@/hooks/useBalance';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useHome } from '@/hooks/useHome';
import { useMe } from '@/hooks/useMe';
import { formatRupiah } from '@/lib/format';
import { supportWhatsAppNumber, supportWhatsAppUrl } from '@/lib/settings';
import { colors, spacing } from '@/theme/tokens';

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const meQuery = useMe();
  const balanceQuery = useBalance();
  const homeQuery = useHome();
  const configQuery = useAppConfig();

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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
        <View style={styles.header}>
          <AppText variant="labelSmall" color={colors.coralDark}>
            AKUN SAYA
          </AppText>
          <AppText variant="headlineLarge">Halo, {profile?.display_name || 'Pengguna'}</AppText>
        </View>

        <SurfaceCard style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Avatar name={profile?.display_name} size={56} />
            <View style={styles.profileCopy}>
              <AppText variant="titleLarge" numberOfLines={1}>
                {profile?.display_name || 'Pengguna'}
              </AppText>
              <AppText variant="bodySmall" color={colors.muted} numberOfLines={1}>
                {profile?.email || 'Email belum tersedia'}
              </AppText>
              <AppText variant="bodySmall" color={colors.muted} numberOfLines={1}>
                {profile?.phone || 'Nomor WhatsApp belum diisi'}
              </AppText>
            </View>
            <View style={styles.verifiedPill}>
              <AppText variant="labelSmall" color={colors.tealInk}>
                {profile?.email_verified ? 'TERVERIFIKASI' : 'AKTIF'}
              </AppText>
            </View>
          </View>
        </SurfaceCard>

        <View style={styles.balanceWrap}>
          <BalanceCard
            balance={balanceQuery.data?.balance ?? profile?.balance ?? 0}
            limit={balanceQuery.data?.balance_limit ?? profile?.balance_limit}
            onTopup={() => router.push('/topup')}
            onHistory={() => router.push('/saldo/riwayat')}
          />
        </View>

        <AppText variant="labelSmall" color={colors.muted} style={styles.groupLabel}>
          TRANSAKSI
        </AppText>
        <SurfaceCard padded={false} style={styles.groupCard}>
          <View style={styles.groupInner}>
            <ListRow
              icon="receipt-text-outline"
              title="Pesanan saya"
              description="Status dan detail semua transaksi"
              onPress={() => router.push('/(tabs)/pesanan')}
            />
            {billsEnabled ? (
              <ListRow
                icon="file-document-outline"
                title="Bayar tagihan"
                description="Listrik, air, BPJS, pajak, dan lainnya"
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/katalog',
                    params: { type: 'postpaid' },
                  })
                }
              />
            ) : null}
            <ListRow
              icon="wallet-plus-outline"
              title="Top up saldo"
              description={`Batas saldo ${formatRupiah(balanceQuery.data?.balance_limit ?? profile?.balance_limit ?? 1000000)}`}
              onPress={() => router.push('/topup')}
            />
            <ListRow
              icon="history"
              title="Riwayat saldo"
              description="Top up, pembelian, dan refund"
              onPress={() => router.push('/saldo/riwayat')}
              showDivider={false}
            />
          </View>
        </SurfaceCard>

        <AppText variant="labelSmall" color={colors.muted} style={styles.groupLabel}>
          KEAMANAN
        </AppText>
        <SurfaceCard padded={false} style={styles.groupCard}>
          <View style={styles.groupInner}>
            <ListRow
              icon="account-edit-outline"
              title="Edit profil"
              description="Nama dan nomor WhatsApp"
              onPress={() => router.push('/profil/edit')}
            />
            <ListRow
              icon="lock-reset"
              title="Ubah password"
              description="Ganti password akun"
              onPress={() => router.push('/profil/password')}
              showDivider={false}
            />
          </View>
        </SurfaceCard>

        <AppText variant="labelSmall" color={colors.muted} style={styles.groupLabel}>
          BANTUAN
        </AppText>
        <SurfaceCard padded={false} style={styles.groupCard}>
          <View style={styles.groupInner}>
            <ListRow
              icon="whatsapp"
              tone="teal"
              title="Chat CS"
              description={supportNumber ? `+${supportNumber}` : 'Buka pusat bantuan'}
              onPress={openSupport}
              showDivider={!!settings?.wa_group_link}
            />
            {settings?.wa_group_link ? (
              <ListRow
                icon="account-group-outline"
                tone="teal"
                title="Grup WhatsApp"
                description="Info promo dan pengumuman"
                onPress={openGroup}
                showDivider={false}
              />
            ) : null}
          </View>
        </SurfaceCard>

        <SurfaceCard padded={false} style={styles.logoutCard}>
          <View style={styles.groupInner}>
            <ListRow
              icon="logout"
              tone="danger"
              title="Keluar"
              description="Akhiri sesi di perangkat ini"
              onPress={() => setLogoutVisible(true)}
              showDivider={false}
            />
          </View>
        </SurfaceCard>

        <View style={styles.footer}>
          <AppText variant="labelSmall" color={colors.muted}>
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
        message="Kamu perlu masuk kembali untuk melihat pesanan dan saldo."
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
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  profileCard: {
    marginTop: spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  profileCopy: {
    flex: 1,
    gap: 2,
  },
  verifiedPill: {
    backgroundColor: colors.tealSoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 100,
  },
  balanceWrap: {
    marginTop: spacing.base,
  },
  groupLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    letterSpacing: 1.4,
  },
  groupCard: {
    overflow: 'hidden',
  },
  groupInner: {
    paddingHorizontal: spacing.base,
  },
  logoutCard: {
    marginTop: spacing.lg,
    borderColor: '#EFC7C2',
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: 2,
  },
});
