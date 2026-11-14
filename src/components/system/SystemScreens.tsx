import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Linking, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator } from 'react-native-paper';

import { AppLogo } from '@/components/ui/AppLogo';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Buttons';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

export function MaintenanceScreen({
  message,
  onRetry,
  retrying,
}: {
  message?: string;
  onRetry: () => void;
  retrying?: boolean;
}) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.content}>
        <AppLogo size={72} />
        <AppText variant="labelSmall" color={colors.coralDark} style={styles.eyebrow}>
          NOXARIANET
        </AppText>
        <AppText variant="headlineLarge" align="center">
          Toko sedang tutup sebentar
        </AppText>
        <AppText variant="bodyMedium" color={colors.muted} align="center" style={styles.copy}>
          {message ||
            'Kami sedang merawat layanan agar transaksi tetap aman dan lancar. Silakan kembali beberapa saat lagi.'}
        </AppText>
        <View style={styles.iconRow}>
          <MaterialCommunityIcons
            name="tools"
            size={18}
            color={colors.coralDark}
          />
          <AppText variant="bodySmall" color={colors.muted}>
            Maintenance terjadwal
          </AppText>
        </View>
      </View>

      <View style={styles.actions}>
        <PrimaryButton onPress={onRetry} disabled={retrying}>
          {retrying ? 'Memeriksa…' : 'Coba lagi'}
        </PrimaryButton>
        {retrying ? (
          <ActivityIndicator color={colors.coralDark} style={styles.spinner} />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

export function UpdateScreen({
  currentVersion,
  minimumVersion,
  onRetry,
  retrying,
}: {
  currentVersion?: string | null;
  minimumVersion?: string | null;
  onRetry: () => void;
  retrying?: boolean;
}) {
  const updateUrl = process.env.EXPO_PUBLIC_UPDATE_URL;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.content}>
        <View style={styles.updateIcon}>
          <MaterialCommunityIcons
            name="cellphone-arrow-down"
            size={36}
            color={colors.coralDark}
          />
        </View>
        <AppText variant="labelSmall" color={colors.coralDark} style={styles.eyebrow}>
          PEMBARUAN TERSEDIA
        </AppText>
        <AppText variant="headlineLarge" align="center">
          Versi aplikasi terlalu lama
        </AppText>
        <AppText variant="bodyMedium" color={colors.muted} align="center" style={styles.copy}>
          Versi {currentVersion || 'saat ini'} tidak lagi didukung. Versi minimum
          yang diperlukan adalah {minimumVersion || 'versi terbaru'}.
        </AppText>

        <View style={styles.versionCard}>
          <View style={styles.versionRow}>
            <AppText variant="bodySmall" color={colors.muted}>
              Terpasang
            </AppText>
            <AppText variant="bodySmall" weight="monoMedium">
              {currentVersion || '—'}
            </AppText>
          </View>
          <View style={styles.versionDivider} />
          <View style={styles.versionRow}>
            <AppText variant="bodySmall" color={colors.muted}>
              Minimum
            </AppText>
            <AppText variant="bodySmall" weight="monoMedium">
              {minimumVersion || '—'}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        {updateUrl ? (
          <PrimaryButton onPress={() => Linking.openURL(updateUrl)}>
            Buka halaman unduh
          </PrimaryButton>
        ) : (
          <PrimaryButton onPress={onRetry} disabled={retrying}>
            {retrying ? 'Memeriksa…' : 'Coba lagi'}
          </PrimaryButton>
        )}
        {updateUrl ? (
          <SecondaryButton onPress={onRetry} disabled={retrying}>
            {retrying ? 'Memeriksa…' : 'Sudah diperbarui'}
          </SecondaryButton>
        ) : (
          <AppText variant="bodySmall" color={colors.muted} align="center">
            Minta APK terbaru ke admin melalui grup WhatsApp Noxarianet.
          </AppText>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    maxWidth: 420,
    alignSelf: 'center',
  },
  eyebrow: {
    letterSpacing: 1.4,
    marginTop: spacing.sm,
  },
  copy: {
    maxWidth: 340,
    marginTop: spacing.xs,
    fontFamily: fonts.regular,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  updateIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.coralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    alignSelf: 'stretch',
    maxWidth: 320,
    width: '100%',
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  versionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.line,
  },
  actions: {
    gap: spacing.sm,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  spinner: {
    marginTop: spacing.xs,
  },
});
