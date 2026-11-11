import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput } from 'react-native-paper';

import { AuthShell } from '@/components/auth/AuthShell';
import { register } from '@/api/mobile';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton, TextButton } from '@/components/ui/Buttons';
import { InfoBanner } from '@/components/ui/InfoBanner';
import { TextField } from '@/components/ui/TextField';
import { getErrorMessage } from '@/lib/errors';
import { maskEmail } from '@/lib/format';
import { savePendingRegistration } from '@/lib/storage';
import {
  hasErrors,
  validateRegister,
  type FieldErrors,
} from '@/lib/validation';
import { colors, fonts, spacing } from '@/theme/tokens';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const nextErrors = validateRegister({
      display_name: displayName,
      email,
      phone,
      password,
      confirm_password: confirmPassword,
    });
    setErrors(nextErrors);
    setFormError(null);
    if (hasErrors(nextErrors)) return;

    setLoading(true);
    try {
      const response = await register({
        email,
        phone,
        display_name: displayName,
        password,
      });
      const now = Date.now();
      const maskedEmail = response.masked_email || maskEmail(response.email);
      await savePendingRegistration({
        email: response.email,
        maskedEmail,
        expiresAt: now + response.expires_in * 1000,
        resendAt: now + response.resend_available_in * 1000,
      });
      router.push({
        pathname: '/verify',
        params: { email: response.email, masked: maskedEmail },
      });
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const clearFieldError = (key: string) => {
    if (errors[key]) setErrors((current) => ({ ...current, [key]: '' }));
  };

  return (
    <AuthShell
      eyebrow="Akun baru"
      title="Daftar dalam dua langkah"
      description="Isi data akun, lalu verifikasi kode 6 digit yang kami kirim ke emailmu."
      footer={
        <View style={styles.footerRow}>
          <AppText variant="bodySmall" color={colors.muted}>
            Sudah punya akun?
          </AppText>
          <TextButton onPress={() => router.replace('/login')} compact>
            Masuk
          </TextButton>
        </View>
      }
    >
      {formError ? (
        <InfoBanner
          tone="danger"
          title="Pendaftaran belum berhasil"
          message={formError}
        />
      ) : null}

      <AppText variant="labelSmall" color={colors.coralDark} style={styles.section}>
        01 / IDENTITAS
      </AppText>

      <TextField
        label="Nama lengkap"
        value={displayName}
        onChangeText={(value) => {
          setDisplayName(value);
          clearFieldError('display_name');
        }}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        errorText={errors.display_name}
        left={<TextInput.Icon icon="account-outline" color={colors.muted} />}
      />

      <TextField
        label="Email"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          clearFieldError('email');
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        autoCorrect={false}
        errorText={errors.email}
        left={<TextInput.Icon icon="email-outline" color={colors.muted} />}
      />

      <TextField
        label="Nomor WhatsApp"
        value={phone}
        onChangeText={(value) => {
          setPhone(value);
          clearFieldError('phone');
        }}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        errorText={errors.phone}
        hint="Contoh: 08123456789"
        left={<TextInput.Icon icon="whatsapp" color={colors.muted} />}
      />

      <AppText variant="labelSmall" color={colors.coralDark} style={styles.section}>
        02 / KEAMANAN
      </AppText>

      <TextField
        label="Password"
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          clearFieldError('password');
        }}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        errorText={errors.password}
        hint="Minimal 8 karakter."
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
        label="Ulangi password"
        value={confirmPassword}
        onChangeText={(value) => {
          setConfirmPassword(value);
          clearFieldError('confirm_password');
        }}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        errorText={errors.confirm_password}
        left={<TextInput.Icon icon="lock-check-outline" color={colors.muted} />}
        onSubmitEditing={() => void handleSubmit()}
        returnKeyType="go"
      />

      <PrimaryButton
        onPress={() => void handleSubmit()}
        loading={loading}
        disabled={loading}
        style={styles.submit}
      >
        Kirim kode verifikasi
      </PrimaryButton>

      <AppText variant="bodySmall" color={colors.muted} align="center" style={styles.legal}>
        Pastikan email aktif. Kode verifikasi berlaku 30 menit dan hanya dapat
        dipakai sekali.
      </AppText>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    flexWrap: 'wrap',
  },
  section: {
    letterSpacing: 1.2,
    marginTop: spacing.sm,
  },
  submit: {
    marginTop: spacing.xs,
  },
  legal: {
    fontFamily: fonts.regular,
    paddingHorizontal: spacing.lg,
  },
});
