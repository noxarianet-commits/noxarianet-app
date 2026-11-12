import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput } from 'react-native-paper';

import { updateMe } from '@/api/mobile';
import { queryKeys } from '@/api/queryKeys';
import { useAuth } from '@/auth/AuthProvider';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/Buttons';
import { InfoBanner } from '@/components/ui/InfoBanner';
import { KeyboardScreen, ScreenScroll } from '@/components/ui/Screen';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { TextField } from '@/components/ui/TextField';
import { useMe } from '@/hooks/useMe';
import { getErrorMessage } from '@/lib/errors';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

export default function EditProfileScreen() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuth();
  const meQuery = useMe();
  const profile = meQuery.data ?? user;

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const nextErrors: Record<string, string> = {};
    if (!displayName.trim()) nextErrors.display_name = 'Nama wajib diisi.';
    if (!phone.trim()) nextErrors.phone = 'Nomor WhatsApp wajib diisi.';
    else if (!/^(\+?62|0)8\d{7,12}$/.test(phone.replace(/[\s-]/g, ''))) {
      nextErrors.phone = 'Masukkan nomor WhatsApp Indonesia yang valid.';
    }

    setErrors(nextErrors);
    setFormError(null);
    setInfo(null);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const response = await updateMe({
        display_name: displayName.trim(),
        phone: phone.trim(),
      });
      setUser(response.user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
      setInfo('Profil berhasil diperbarui.');
      setTimeout(() => {
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)/akun');
      }, 550);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardScreen>
      <ScreenScroll>
        <AppHeader title="Edit profil" />

        <AppText variant="bodyMedium" color={colors.muted} style={styles.intro}>
          Pastikan nama dan nomor WhatsApp aktif. Data ini dipakai untuk
          kebutuhan pesanan dan bantuan.
        </AppText>

        {formError ? (
          <InfoBanner tone="danger" title="Gagal menyimpan" message={formError} />
        ) : null}
        {info ? (
          <InfoBanner tone="success" title="Tersimpan" message={info} />
        ) : null}

        <SurfaceCard style={styles.card}>
          <View style={styles.emailRow}>
            <View style={styles.emailIcon}>
              <TextInput.Icon icon="email-lock" color={colors.muted} size={20} />
            </View>
            <View style={styles.emailCopy}>
              <AppText variant="labelSmall" color={colors.muted}>
                EMAIL
              </AppText>
              <AppText variant="titleMedium" numberOfLines={1}>
                {profile?.email || '—'}
              </AppText>
              <AppText variant="bodySmall" color={colors.muted}>
                Email tidak dapat diubah dari aplikasi.
              </AppText>
            </View>
          </View>

          <TextField
            label="Nama lengkap"
            value={displayName}
            onChangeText={(value) => {
              setDisplayName(value);
              if (errors.display_name) {
                setErrors((current) => ({ ...current, display_name: '' }));
              }
            }}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            errorText={errors.display_name}
            left={<TextInput.Icon icon="account-outline" color={colors.muted} />}
          />

          <TextField
            label="Nomor WhatsApp"
            value={phone}
            onChangeText={(value) => {
              setPhone(value);
              if (errors.phone) {
                setErrors((current) => ({ ...current, phone: '' }));
              }
            }}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            errorText={errors.phone}
            hint="Contoh: 08123456789"
            left={<TextInput.Icon icon="whatsapp" color={colors.muted} />}
          />
        </SurfaceCard>

        <PrimaryButton
          onPress={() => void handleSave()}
          loading={saving}
          disabled={saving}
        >
          Simpan perubahan
        </PrimaryButton>

        <AppText variant="bodySmall" color={colors.muted} align="center" style={styles.note}>
          Perubahan nomor WhatsApp tidak mengubah riwayat pesanan yang sudah ada.
        </AppText>
      </ScreenScroll>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  intro: {
    marginBottom: spacing.base,
  },
  card: {
    gap: spacing.md,
    marginBottom: spacing.base,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  emailIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emailCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  note: {
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
  },
});
