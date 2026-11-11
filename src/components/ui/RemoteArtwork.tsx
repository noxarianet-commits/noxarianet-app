import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors, fonts, radius } from '@/theme/tokens';

type Props = {
  /** URL gambar utama. `null`/undefined berarti tidak ada aset dari API. */
  uri?: string | null;
  /** URL cadangan, dipakai kalau gambar utama gagal dimuat. */
  fallbackUri?: string | null;
  /** Teks fallback (mis. huruf pertama nama produk). */
  label?: string | null;
  size: number;
  fit?: 'cover' | 'contain';
  cornerRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Gambar remote dengan fallback berjenjang lalu inisial. `expo-image` sudah
 * bisa merender SVG di Android/iOS, jadi URL dari API (PNG maupun SVG) bisa
 * langsung dipakai.
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
  // URL yang gagal dimuat dicatat, bukan state boolean, supaya pergantian
  // aset dari API otomatis pulih tanpa efek.
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

  const initial = String(label || '').trim()[0]?.toUpperCase() || 'N';

  const handleError = () => {
    if (!activeUri) return;
    setFailed((current) =>
      current.includes(activeUri) ? current : [...current, activeUri],
    );
  };

  return (
    <View style={[styles.box, box, styles.media, style]}>
      <AppText style={[styles.initial, { fontSize: Math.round(size * 0.4) }]}>
        {initial}
      </AppText>
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
    backgroundColor: colors.surfaceMuted,
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  initial: {
    fontFamily: fonts.extraBold,
    color: colors.coralDark,
  },
});
