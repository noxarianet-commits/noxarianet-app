import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image';
import type { ComponentProps } from 'react';
import { useMemo, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius } from '@/theme/tokens';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type Props = {
  /** URL gambar utama. `null`/undefined berarti tidak ada aset dari API. */
  uri?: string | null;
  /** URL cadangan, dipakai kalau gambar utama gagal dimuat. */
  fallbackUri?: string | null;
  /** Teks label/nama kategori/produk untuk menentukan icon vektor jika gambar belum ada */
  label?: string | null;
  size: number;
  fit?: 'cover' | 'contain';
  cornerRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Pemetaan cerdas nama produk / kategori ke Icon Vektor resmi (MaterialCommunityIcons),
 * tanpa inisial huruf dan tanpa emoji.
 */
function getFallbackIconInfo(label?: string | null): { name: IconName; color: string } {
  if (!label) return { name: 'shopping-outline', color: colors.coralDark };
  const text = label.toLowerCase().trim();

  // E-Wallet & Dompet Digital
  if (
    text.includes('wallet') ||
    text.includes('dompet') ||
    text.includes('dana') ||
    text.includes('ovo') ||
    text.includes('gopay') ||
    text.includes('shopee') ||
    text.includes('linkaja') ||
    text.includes('saldo') ||
    text.includes('kaspro') ||
    text.includes('doku')
  ) {
    return { name: 'wallet-outline', color: '#6366F1' };
  }

  // Games & Voucher Game
  if (
    text.includes('game') ||
    text.includes('gaming') ||
    text.includes('legend') ||
    text.includes('free fire') ||
    text.includes('pubg') ||
    text.includes('roblox') ||
    text.includes('valorant') ||
    text.includes('genshin') ||
    text.includes('steam') ||
    text.includes('point blank') ||
    text.includes('honkai')
  ) {
    return { name: 'gamepad-variant-outline', color: '#8B5CF6' };
  }

  // Aplikasi Premium & Streaming
  if (
    text.includes('aplikasi') ||
    text.includes('app') ||
    text.includes('premium') ||
    text.includes('stream') ||
    text.includes('netflix') ||
    text.includes('spotify') ||
    text.includes('youtube') ||
    text.includes('canva') ||
    text.includes('disney') ||
    text.includes('vidio') ||
    text.includes('viu') ||
    text.includes('wetv') ||
    text.includes('bstation')
  ) {
    return { name: 'apps', color: colors.coralDark };
  }

  // Pulsa & Paket Data
  if (
    text.includes('pulsa') ||
    text.includes('paket') ||
    text.includes('data') ||
    text.includes('kuota') ||
    text.includes('telkomsel') ||
    text.includes('indosat') ||
    text.includes('im3') ||
    text.includes('xl') ||
    text.includes('tri') ||
    text.includes('axis') ||
    text.includes('smartfren') ||
    text.includes('by.u')
  ) {
    return { name: 'cellphone', color: '#0EA5E9' };
  }

  // Listrik PLN & Token
  if (
    text.includes('listrik') ||
    text.includes('pln') ||
    text.includes('token') ||
    text.includes('daya')
  ) {
    return { name: 'lightning-bolt-outline', color: '#F59E0B' };
  }

  // Air PDAM
  if (text.includes('air') || text.includes('pdam')) {
    return { name: 'water-outline', color: '#06B6D4' };
  }

  // BPJS & Kesehatan
  if (text.includes('bpjs') || text.includes('kesehatan')) {
    return { name: 'shield-cross-outline', color: '#10B981' };
  }

  // Internet Rumah & WiFi
  if (
    text.includes('wifi') ||
    text.includes('internet') ||
    text.includes('indihome') ||
    text.includes('biznet') ||
    text.includes('myrepublic') ||
    text.includes('first media')
  ) {
    return { name: 'router-wireless', color: '#3B82F6' };
  }

  // TV Kabel
  if (
    text.includes('tv') ||
    text.includes('kabel') ||
    text.includes('vision') ||
    text.includes('k-vision')
  ) {
    return { name: 'television-classic', color: '#6366F1' };
  }

  // Voucher, Gift Card, Lisensi
  if (
    text.includes('voucher') ||
    text.includes('gift') ||
    text.includes('lisensi') ||
    text.includes('key')
  ) {
    return { name: 'ticket-percent-outline', color: '#F43F5E' };
  }

  // Tagihan / PBB / Multifinance
  if (
    text.includes('tagihan') ||
    text.includes('pascabayar') ||
    text.includes('pbb') ||
    text.includes('pajak') ||
    text.includes('finance') ||
    text.includes('angsuran')
  ) {
    return { name: 'file-document-outline', color: '#14B8A6' };
  }

  // Default clean vector icon
  return { name: 'shopping-outline', color: colors.coralDark };
}

/**
 * Gambar remote dengan fallback vector icon cerdas (bukan inisial teks dan bukan emoji).
 */
export function RemoteArtwork({
  uri,
  fallbackUri,
  label,
  size,
  fit = 'contain',
  cornerRadius,
  style,
}: Props) {
  const [failed, setFailed] = useState<string[]>([]);

  const activeUri = useMemo(() => {
    if (uri && !failed.includes(uri)) return uri;
    if (fallbackUri && !failed.includes(fallbackUri)) return fallbackUri;
    return null;
  }, [uri, fallbackUri, failed]);

  const box = useMemo(
    () => ({
      width: size,
      height: size,
      borderRadius: cornerRadius ?? radius.sm,
    }),
    [size, cornerRadius],
  );

  const fallbackIcon = useMemo(() => getFallbackIconInfo(label), [label]);
  const iconSize = Math.max(Math.round(size * 0.72), 16);

  const handleError = () => {
    if (!activeUri) return;
    setFailed((current) =>
      current.includes(activeUri) ? current : [...current, activeUri],
    );
  };

  return (
    <View style={[styles.box, box, styles.media, style]}>
      <MaterialCommunityIcons
        name={fallbackIcon.name}
        size={iconSize}
        color={fallbackIcon.color}
      />
      {activeUri ? (
        <Image
          source={{ uri: activeUri }}
          style={styles.fill}
          contentFit={fit}
          transition={150}
          cachePolicy="memory-disk"
          onError={handleError}
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  media: {
    backgroundColor: 'transparent',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

