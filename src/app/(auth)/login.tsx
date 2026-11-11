import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput } from 'react-native-paper';

import { AuthShell } from '@/components/auth/AuthShell';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton, SecondaryButton, TextButton } from '@/components/ui/Buttons';
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
import { colors, fonts, spacing } from '@/theme/tokens';

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
      title="Masuk ke toko"
      description="Kelola pesanan, saldo, dan pembelian digitalmu dalam satu tempat."
      footer={
        <View style={styles.footerRow}>
          <AppText variant="bodySmall" color={colors.muted}>
            Belum punya akun?
          </AppText>
          <TextButton
            onPress={() => {
              clearNotice();
              router.push('/register');
            }}
            compact
          >
            Daftar sekarang
          </TextButton>
        </View>
      }
    >
      {pending ? (
        <InfoBanner
          tone="info"
          title="Verifikasi email belum selesai"
          message={`Kode sudah dikirim ke ${pending.maskedEmail}.`}
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
          title="Tidak bisa masuk"
          message={formError}
        />
      ) : null}

      <TextField
        label="Email"
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
        left={<TextInput.Icon icon="email-outline" color={colors.muted} />}
      />

      <TextField
        label="Password"
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
        onSubmitEditing={() => void handleSubmit()}
        returnKeyType="go"
      />

      <View style={styles.forgotRow}>
        <TextButton
          onPress={() => router.push('/forgot-password')}
          compact
          style={styles.forgotButton}
        >
          Lupa password?
        </TextButton>
      </View>

      <PrimaryButton
        onPress={() => void handleSubmit()}
        loading={loading}
        disabled={loading}
      >
        Masuk
      </PrimaryButton>

      <AppText variant="bodySmall" color={colors.muted} align="center" style={styles.legal}>
        Gunakan email dan password akun Noxarianet Store milikmu.
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
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -spacing.sm,
  },
  forgotButton: {
    marginRight: -12,
  },
  legal: {
    fontFamily: fonts.regular,
    paddingHorizontal: spacing.lg,
  },
});
