import type { Product } from '@/api/types';
import { RemoteArtwork } from '@/components/ui/RemoteArtwork';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Aset produk dari API:
 * - `image` → PNG khusus produk (paling spesifik, dipakai duluan).
 * - `icon`  → SVG ikon kategori (dipakai sebagai cadangan).
 *
 * Kalau keduanya gagal dimuat, tampilan kembali ke inisial nama.
 */
export function ProductArtwork({
  product,
  size,
  fit = 'contain',
  cornerRadius,
  style,
}: {
  product: Pick<Product, 'name' | 'icon' | 'image'>;
  size: number;
  fit?: 'cover' | 'contain';
  cornerRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <RemoteArtwork
      uri={product.image}
      fallbackUri={product.icon}
      label={product.name}
      size={size}
      fit={fit}
      cornerRadius={cornerRadius}
      style={style}
    />
  );
}
