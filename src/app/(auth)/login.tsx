import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { TextInput } from 'react-native-paper';

import { AuthShell } from '@/components/auth/AuthShell';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Buttons';
import { InfoBanner } from '@/components/ui/InfoBanner';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/auth/AuthProvider';
import { getErrorMessage } from '@/lib/errors';
import {
  clearPendingRegistration,
  loadPendingRegistration,
  type PendingRegistration,
} from '@/lib/storage';
import { hasErrors, validateLogin, type FieldErrors } from '@/lib/validation';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

export default function LoginScreen() {
  const { signIn, notice, clearNotice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<PendingRegistration | null>(null);

  useEffect(() => {
    let active = true;

    void loadPendingRegistration().then((stored) => {
      if (!active || !stored) return;
      if (stored.expiresAt > Date.now()) setPending(stored);
      else void clearPendingRegistration();
    });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async () => {
    const nextErrors = validateLogin({ email, password });
    setErrors(nextErrors);
    setFormError(null);
    if (hasErrors(nextErrors)) return;

    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/');
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Selamat datang kembali"
      title="Masuk ke Akun"
      description="Kelola pesanan, saldo, dan pembelian produk digitalmu dalam satu tempat."
      footer={
        <View style={styles.footerGlassCard}>
          <AppText variant="bodyMedium" color={colors.muted}>
            Belum memiliki akun?
          </AppText>
          <Pressable
            onPress={() => {
              clearNotice();
              router.push('/register');
            }}
            style={({ pressed }) => [styles.registerBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Daftar akun baru"
          >
            <AppText variant="labelLarge" style={styles.registerText}>
              Daftar Sekarang
            </AppText>
            <MaterialCommunityIcons name="arrow-right" size={16} color={colors.coral} />
          </Pressable>
        </View>
      }
    >
      {/* Floating Frosted Glass Form Card */}
      <View style={styles.glassFormCard}>
        <View style={styles.formHeader}>
          <View style={styles.formHeaderBadge}>
            <MaterialCommunityIcons name="lock-outline" size={18} color={colors.coral} />
          </View>
          <View style={styles.formHeaderTextWrap}>
            <AppText variant="titleMedium" style={styles.formTitle}>
              Autentikasi Akun
            </AppText>
            <AppText variant="bodySmall" color={colors.muted}>
              Masukkan email & kata sandi terdaftar
            </AppText>
          </View>
        </View>

        {pending ? (
          <InfoBanner
            tone="info"
            title="Verifikasi email belum selesai"
            message={`Kode verifikasi telah dikirim ke ${pending.maskedEmail}.`}
            action={
              <SecondaryButton
                fullWidth={false}
                onPress={() =>
                  router.push({
                    pathname: '/verify',
                    params: {
                      email: pending.email,
                      masked: pending.maskedEmail,
                    },
                  })
                }
              >
                Lanjutkan verifikasi
              </SecondaryButton>
            }
          />
        ) : null}

        {notice && !formError ? (
          <InfoBanner
            tone="warning"
            title="Sesi berakhir"
            message={notice}
          />
        ) : null}

        {formError ? (
          <InfoBanner
            tone="danger"
            title="Gagal Masuk"
            message={formError}
          />
        ) : null}

        <View style={styles.inputsGroup}>
          <TextField
            label="Alamat Email"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (errors.email) setErrors((current) => ({ ...current, email: '' }));
              if (notice) clearNotice();
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
            label="Kata Sandi"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (errors.password) setErrors((current) => ({ ...current, password: '' }));
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            errorText={errors.password}
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
            onSubmitEditing={() => void handleSubmit()}
            returnKeyType="go"
            style={styles.glassInput}
          />
        </View>

        <View style={styles.forgotRow}>
          <Pressable
            onPress={() => router.push('/forgot-password')}
            style={({ pressed }) => [styles.forgotPressable, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="key-outline" size={14} color={colors.coral} />
            <AppText variant="labelMedium" color={colors.coral} style={styles.forgotText}>
              Lupa kata sandi?
            </AppText>
          </Pressable>
        </View>

        <PrimaryButton
          onPress={() => void handleSubmit()}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        >
          Masuk Sekarang
        </PrimaryButton>
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
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 4,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(231, 226, 241, 0.7)',
    marginBottom: spacing.xs,
  },
  formHeaderBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.coralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formHeaderTextWrap: {
    flex: 1,
    gap: 1,
  },
  formTitle: {
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
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -spacing.xs,
  },
  forgotPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  forgotText: {
    fontFamily: fonts.semiBold,
  },
  submitButton: {
    marginTop: spacing.xs,
    borderRadius: radius.pill,
    elevation: 2,
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
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  registerText: {
    fontFamily: fonts.bold,
    color: colors.coral,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
