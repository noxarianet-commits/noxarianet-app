import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';

import { changePassword } from '@/api/mobile';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Buttons';
import { InfoBanner } from '@/components/ui/InfoBanner';
import { KeyboardScreen, ScreenScroll } from '@/components/ui/Screen';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { TextField } from '@/components/ui/TextField';
import { getErrorMessage } from '@/lib/errors';
import {
  hasErrors,
  validatePasswordChange,
  type FieldErrors,
} from '@/lib/validation';
import { colors, fonts, spacing } from '@/theme/tokens';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const nextErrors = validatePasswordChange({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    setErrors(nextErrors);
    setFormError(null);
    setSaved(false);
    if (hasErrors(nextErrors)) return;

    setSaving(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSaved(true);
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardScreen>
      <ScreenScroll>
        <AppHeader title="Ubah password" />

        <AppText variant="bodyMedium" color={colors.muted} style={styles.intro}>
          Gunakan password yang kuat dan tidak dipakai di aplikasi lain. Minimal
          8 karakter.
        </AppText>

        {formError ? (
          <InfoBanner tone="danger" title="Password belum berubah" message={formError} />
        ) : null}
        {saved ? (
          <InfoBanner
            tone="success"
            title="Password berhasil diubah"
            message="Gunakan password baru pada sesi masuk berikutnya."
            action={
              <SecondaryButton
                fullWidth={false}
                onPress={() => router.back()}
              >
                Kembali
              </SecondaryButton>
            }
          />
        ) : null}

        <SurfaceCard style={styles.card}>
          <TextField
            label="Password saat ini"
            value={currentPassword}
            onChangeText={(value) => {
              setCurrentPassword(value);
              if (errors.current_password) {
                setErrors((current) => ({ ...current, current_password: '' }));
              }
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            errorText={errors.current_password}
            left={<TextInput.Icon icon="lock-outline" color={colors.muted} />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                color={colors.muted}
                forceTextInputFocus={false}
                onPress={() => setShowPassword((current) => !current)}
                accessibilityLabel={
                  showPassword ? 'Sembunyikan password' : 'Tampilkan password'
                }
              />
            }
          />

          <TextField
            label="Password baru"
            value={newPassword}
            onChangeText={(value) => {
              setNewPassword(value);
              if (errors.new_password) {
                setErrors((current) => ({ ...current, new_password: '' }));
              }
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            errorText={errors.new_password}
            hint="Minimal 8 karakter."
            left={<TextInput.Icon icon="lock-plus-outline" color={colors.muted} />}
          />

          <TextField
            label="Ulangi password baru"
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              if (errors.confirm_password) {
                setErrors((current) => ({ ...current, confirm_password: '' }));
              }
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
            errorText={errors.confirm_password}
            left={<TextInput.Icon icon="lock-check-outline" color={colors.muted} />}
            onSubmitEditing={() => void handleSubmit()}
            returnKeyType="done"
          />
        </SurfaceCard>

        <PrimaryButton
          onPress={() => void handleSubmit()}
          loading={saving}
          disabled={saving}
        >
          Simpan password baru
        </PrimaryButton>

        <AppText variant="bodySmall" color={colors.muted} align="center" style={styles.note}>
          Lupa password saat ini? Keluar lalu gunakan menu lupa password di
          halaman masuk.
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
  note: {
    marginTop: spacing.sm,
    fontFamily: fonts.regular,
  },
});
