import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { TextInput } from 'react-native-paper';

import { AuthShell } from '@/components/auth/AuthShell';
import { register } from '@/api/mobile';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton } from '@/components/ui/Buttons';
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
import { colors, fonts, radius, spacing } from '@/theme/tokens';

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
      eyebrow="Registrasi Akun"
      title="Daftar Akun Baru"
      description="Lengkapi data akun untuk mulai transaksi otomatis dan top up saldo."
      onBack={() => router.replace('/login')}
      footer={
        <View style={styles.footerGlassCard}>
          <AppText variant="bodyMedium" color={colors.muted}>
            Sudah memiliki akun?
          </AppText>
          <Pressable
            onPress={() => router.replace('/login')}
            style={({ pressed }) => [styles.loginBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Masuk ke akun yang sudah ada"
          >
            <AppText variant="labelLarge" style={styles.loginText}>
              Masuk Sekarang
            </AppText>
            <MaterialCommunityIcons name="arrow-right" size={16} color={colors.coral} />
          </Pressable>
        </View>
      }
    >
      {formError ? (
        <InfoBanner
          tone="danger"
          title="Pendaftaran Belum Berhasil"
          message={formError}
        />
      ) : null}

      {/* Glass Card: Identitas Akun */}
      <View style={styles.glassFormCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.stepBadge}>
            <AppText variant="labelSmall" style={styles.stepBadgeText}>
              01
            </AppText>
          </View>
          <View style={styles.sectionTitleWrap}>
            <AppText variant="titleMedium" style={styles.sectionTitle}>
              Data Pribadi
            </AppText>
            <AppText variant="bodySmall" color={colors.muted}>
              Informasi identitas dan kontak aktifmu
            </AppText>
          </View>
        </View>

        <View style={styles.inputsGroup}>
          <TextField
            label="Nama Lengkap"
            value={displayName}
            onChangeText={(value) => {
              setDisplayName(value);
              clearFieldError('display_name');
            }}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            errorText={errors.display_name}
            left={<TextInput.Icon icon="account-outline" color={colors.coral} />}
            style={styles.glassInput}
          />

          <TextField
            label="Alamat Email"
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
            left={<TextInput.Icon icon="email-outline" color={colors.coral} />}
            style={styles.glassInput}
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
            hint="Contoh: 081234567890"
            left={<TextInput.Icon icon="whatsapp" color={colors.teal} />}
            style={styles.glassInput}
          />
        </View>
      </View>

      {/* Glass Card: Keamanan Akun */}
      <View style={styles.glassFormCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.stepBadge}>
            <AppText variant="labelSmall" style={styles.stepBadgeText}>
              02
            </AppText>
          </View>
          <View style={styles.sectionTitleWrap}>
            <AppText variant="titleMedium" style={styles.sectionTitle}>
              Keamanan Akun
            </AppText>
            <AppText variant="bodySmall" color={colors.muted}>
              Buat kata sandi yang kuat dan aman
            </AppText>
          </View>
        </View>

        <View style={styles.inputsGroup}>
          <TextField
            label="Kata Sandi"
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
            left={<TextInput.Icon icon="lock-outline" color={colors.coral} />}
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
            style={styles.glassInput}
          />

          <TextField
            label="Konfirmasi Kata Sandi"
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
            left={<TextInput.Icon icon="lock-check-outline" color={colors.coral} />}
            onSubmitEditing={() => void handleSubmit()}
            returnKeyType="go"
            style={styles.glassInput}
          />
        </View>

        <PrimaryButton
          onPress={() => void handleSubmit()}
          loading={loading}
          disabled={loading}
          style={styles.submitBtn}
        >
          Daftar & Kirim Kode OTP
        </PrimaryButton>

        <AppText variant="bodySmall" color={colors.muted} align="center" style={styles.legal}>
          Kode OTP verifikasi 6 digit akan dikirimkan ke email terdaftar.
        </AppText>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  glassFormCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.98)',
    padding: spacing.xl,
    gap: spacing.base,
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(231, 226, 241, 0.7)',
    marginBottom: spacing.xs,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.coralSoft,
    borderWidth: 1,
    borderColor: 'rgba(77, 27, 140, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontFamily: fonts.extraBold,
    color: colors.coral,
    fontSize: 12,
  },
  sectionTitleWrap: {
    flex: 1,
    gap: 1,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
  inputsGroup: {
    gap: spacing.md,
  },
  glassInput: {
    backgroundColor: 'rgba(248, 247, 252, 0.85)',
  },
  submitBtn: {
    marginTop: spacing.xs,
    borderRadius: radius.pill,
    elevation: 2,
  },
  legal: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: spacing.sm,
  },
  footerGlassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  loginText: {
    fontFamily: fonts.bold,
    color: colors.coral,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
