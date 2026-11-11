import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput } from 'react-native-paper';

import {
  forgotPassword,
  resendForgotPassword,
  verifyForgotPassword,
} from '@/api/mobile';
import { AuthShell } from '@/components/auth/AuthShell';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton, TextButton } from '@/components/ui/Buttons';
import { InfoBanner } from '@/components/ui/InfoBanner';
import { TextField } from '@/components/ui/TextField';
import { getErrorMessage } from '@/lib/errors';
import { maskEmail } from '@/lib/format';
import {
  hasErrors,
  isValidEmail,
  isValidPassword,
  type FieldErrors,
} from '@/lib/validation';
import { colors, fonts, spacing } from '@/theme/tokens';

type Step = 'email' | 'reset' | 'done';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [masked, setMasked] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendCode = async () => {
    setFormError(null);
    setInfo(null);

    if (!email.trim()) {
      setErrors({ email: 'Email wajib diisi.' });
      return;
    }
    if (!isValidEmail(email)) {
      setErrors({ email: 'Format email tidak valid.' });
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const response = await forgotPassword(email);
      setMasked(response.masked_email || maskEmail(email));
      setCooldown(response.resend_available_in ?? 60);
      setStep('reset');
      setInfo('Jika email terdaftar, kode reset password sudah dikirim.');
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setFormError(null);
    try {
      const response = await resendForgotPassword(email);
      setCooldown(response.resend_available_in ?? 60);
      setInfo('Kode reset password baru sudah dikirim.');
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setResending(false);
    }
  };

  const handleReset = async () => {
    const nextErrors: FieldErrors = {};
    if (code.length !== 6) nextErrors.code = 'Masukkan kode 6 digit.';
    if (!newPassword) nextErrors.new_password = 'Password baru wajib diisi.';
    else if (!isValidPassword(newPassword)) {
      nextErrors.new_password = 'Password minimal 8 karakter.';
    }
    if (confirmPassword !== newPassword) {
      nextErrors.confirm_password = 'Konfirmasi password tidak sama.';
    }

    setErrors(nextErrors);
    setFormError(null);
    if (hasErrors(nextErrors)) return;

    setLoading(true);
    try {
      await verifyForgotPassword({
        email,
        code,
        new_password: newPassword,
      });
      setStep('done');
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <AuthShell
        eyebrow="Password diperbarui"
        title="Silakan masuk kembali"
        description="Password akunmu sudah diganti. Gunakan password baru untuk masuk ke aplikasi."
        onBack={() => router.replace('/login')}
      >
        <InfoBanner
          tone="success"
          title="Berhasil"
          message="Password baru sudah aktif. Sesi lama di perangkat lain tidak otomatis keluar."
        />
        <PrimaryButton onPress={() => router.replace('/login')}>
          Masuk ke akun
        </PrimaryButton>
      </AuthShell>
    );
  }

  if (step === 'email') {
    return (
      <AuthShell
        eyebrow="Lupa password"
        title="Pulihkan akses akun"
        description="Masukkan email akun. Kami akan mengirim kode 6 digit untuk membuat password baru."
        onBack={() => router.back()}
      >
        {formError ? (
          <InfoBanner tone="danger" title="Gagal mengirim kode" message={formError} />
        ) : null}

        <TextField
          label="Email"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (errors.email) setErrors({});
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          autoCorrect={false}
          errorText={errors.email}
          left={<TextInput.Icon icon="email-outline" color={colors.muted} />}
          onSubmitEditing={() => void handleSendCode()}
          returnKeyType="send"
        />

        <PrimaryButton
          onPress={() => void handleSendCode()}
          loading={loading}
          disabled={loading}
        >
          Kirim kode reset
        </PrimaryButton>

        <AppText variant="bodySmall" color={colors.muted} align="center" style={styles.legal}>
          Demi keamanan, kami tidak memberi tahu apakah sebuah email terdaftar
          atau tidak.
        </AppText>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Reset password"
      title="Buat password baru"
      description={`Masukkan kode yang dikirim ke ${masked} beserta password baru kamu.`}
      onBack={() => {
        setStep('email');
        setFormError(null);
        setInfo(null);
      }}
      footer={
        <View style={styles.footerRow}>
          <AppText variant="bodySmall" color={colors.muted}>
            Belum menerima kode?
          </AppText>
          <TextButton
            compact
            onPress={() => void handleResend()}
            disabled={cooldown > 0 || resending}
          >
            {cooldown > 0
              ? `Kirim ulang (${cooldown}s)`
              : resending
                ? 'Mengirim…'
                : 'Kirim ulang'}
          </TextButton>
        </View>
      }
    >
      {formError ? (
        <InfoBanner tone="danger" title="Reset gagal" message={formError} />
      ) : null}
      {info && !formError ? (
        <InfoBanner tone="info" title="Kode terkirim" message={info} />
      ) : null}

      <TextField
        label="Kode verifikasi"
        value={code}
        onChangeText={(value) => {
          setCode(value.replace(/\D/g, '').slice(0, 6));
          if (errors.code) setErrors((current) => ({ ...current, code: '' }));
        }}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        autoFocus
        errorText={errors.code}
        contentStyle={styles.codeInput}
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
        onSubmitEditing={() => void handleReset()}
        returnKeyType="done"
      />

      <PrimaryButton
        onPress={() => void handleReset()}
        loading={loading}
        disabled={loading}
      >
        Simpan password baru
      </PrimaryButton>
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
  codeInput: {
    fontFamily: fonts.monoMedium,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
  },
  legal: {
    fontFamily: fonts.regular,
    paddingHorizontal: spacing.lg,
  },
});
