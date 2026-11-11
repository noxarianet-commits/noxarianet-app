import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { resendRegistration, verifyRegistration } from '@/api/mobile';
import { AuthShell } from '@/components/auth/AuthShell';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton, TextButton } from '@/components/ui/Buttons';
import { InfoBanner } from '@/components/ui/InfoBanner';
import { TextField } from '@/components/ui/TextField';
import { useAuth } from '@/auth/AuthProvider';
import { getErrorMessage } from '@/lib/errors';
import { maskEmail } from '@/lib/format';
import {
  clearPendingRegistration,
  loadPendingRegistration,
  type PendingRegistration,
} from '@/lib/storage';
import { colors, fonts, spacing } from '@/theme/tokens';

export default function VerifyRegistrationScreen() {
  const params = useLocalSearchParams<{ email?: string; masked?: string }>();
  const { signInWithToken } = useAuth();

  const [pending, setPending] = useState<PendingRegistration | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let active = true;

    (async () => {
      const stored = await loadPendingRegistration();
      if (!active) return;
      setPending(stored);
      setLoaded(true);

      if (stored?.resendAt) {
        setCooldown(
          Math.max(0, Math.ceil((stored.resendAt - Date.now()) / 1000)),
        );
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const email = pending?.email || params.email || '';
  const masked =
    pending?.maskedEmail || params.masked || maskEmail(email);

  const handleVerify = async () => {
    setError(null);
    setInfo(null);

    if (!email) {
      setError('Data pendaftaran tidak ditemukan. Silakan daftar ulang.');
      return;
    }
    if (code.length !== 6) {
      setError('Masukkan kode verifikasi 6 digit.');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyRegistration(email, code);
      await clearPendingRegistration();
      await signInWithToken(response.token, response.user);
      router.replace('/');
    } catch (verifyError) {
      setError(getErrorMessage(verifyError));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0 || resending) return;

    setResending(true);
    setError(null);
    setInfo(null);
    try {
      const response = await resendRegistration(email);
      const seconds = response.resend_available_in ?? 60;
      setCooldown(seconds);
      if (pending) {
        const next = {
          ...pending,
          resendAt: Date.now() + seconds * 1000,
          expiresAt: response.expires_in
            ? Date.now() + response.expires_in * 1000
            : pending.expiresAt,
        };
        setPending(next);
      }
      setInfo('Kode baru sudah dikirim ke email kamu.');
    } catch (resendError) {
      setError(getErrorMessage(resendError));
    } finally {
      setResending(false);
    }
  };

  if (loaded && !email) {
    return (
      <AuthShell
        eyebrow="Verifikasi email"
        title="Sesi pendaftaran berakhir"
        description="Kami tidak menemukan data pendaftaran yang menunggu verifikasi."
        onBack={() => router.replace('/login')}
      >
        <InfoBanner
          tone="warning"
          title="Daftar ulang diperlukan"
          message="Silakan buat akun kembali untuk mendapatkan kode verifikasi baru."
        />
        <PrimaryButton onPress={() => router.replace('/register')}>
          Kembali ke pendaftaran
        </PrimaryButton>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Satu langkah lagi"
      title="Verifikasi email"
      description={`Masukkan kode 6 digit yang kami kirim ke ${masked}.`}
      onBack={() => router.replace('/register')}
      footer={
        <View style={styles.footerRow}>
          <AppText variant="bodySmall" color={colors.muted}>
            Tidak menerima kode?
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
      {error ? (
        <InfoBanner tone="danger" title="Verifikasi gagal" message={error} />
      ) : null}
      {info && !error ? (
        <InfoBanner tone="success" title="Kode terkirim" message={info} />
      ) : null}

      <TextField
        label="Kode verifikasi"
        value={code}
        onChangeText={(value) => {
          setCode(value.replace(/\D/g, '').slice(0, 6));
          if (error) setError(null);
        }}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        autoFocus
        contentStyle={styles.codeInput}
        hint="Kode berlaku 30 menit dan hanya bisa dipakai sekali."
        onSubmitEditing={() => void handleVerify()}
        returnKeyType="done"
      />

      <PrimaryButton
        onPress={() => void handleVerify()}
        loading={loading}
        disabled={loading || code.length !== 6}
      >
        Verifikasi & masuk
      </PrimaryButton>

      <AppText variant="bodySmall" color={colors.muted} align="center" style={styles.legal}>
        Email salah? Kembali dan daftar ulang dengan alamat email yang benar.
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
