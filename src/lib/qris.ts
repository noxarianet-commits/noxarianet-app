import { Alert, Platform } from 'react-native';

// Safe dynamic modules to avoid crashing if native dependencies are pending link/build
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MediaLibrary: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let captureRef: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  MediaLibrary = require('expo-media-library');
} catch {}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const viewShot = require('react-native-view-shot');
  captureRef = viewShot.captureRef;
} catch {}

/**
 * Menyimpan tampilan kode QRIS ke galeri foto perangkat pengguna
 * agar mempermudah pemindaian (scan dari galeri) melalui aplikasi m-Banking atau e-Wallet.
 */
export async function saveQrisToGallery(viewRef: { current: any }): Promise<boolean> {
  if (Platform.OS === 'web') {
    Alert.alert('Info', 'Fitur unduh QRIS tersedia di aplikasi Android dan iOS.');
    return false;
  }

  if (!viewRef.current || !captureRef) {
    Alert.alert('Gagal', 'Tampilan QRIS belum siap untuk disimpan.');
    return false;
  }

  try {
    // 1. Minta izin akses galeri foto jika diperlukan
    if (MediaLibrary?.requestPermissionsAsync) {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
        if (status !== 'granted') {
          // Beberapa OS Android 10+ mengizinkan penyimpanan gambar baru tanpa izin baca eksplisit
        }
      } catch (permErr) {
        console.warn('[saveQris] Permission check ignored:', permErr);
      }
    }

    // 2. Tangkap tampilan QRIS menjadi file gambar PNG
    const localUri = await captureRef(viewRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });

    // 3. Simpan ke galeri foto perangkat
    let saved = false;

    // Class-based Asset.create (Expo SDK 52/58 Next API)
    if (MediaLibrary?.Asset && typeof MediaLibrary.Asset.create === 'function') {
      try {
        await MediaLibrary.Asset.create(localUri);
        saved = true;
      } catch (assetErr) {
        console.warn('[saveQris] Asset.create failed:', assetErr);
      }
    }

    if (!saved && MediaLibrary) {
      try {
        if (typeof MediaLibrary.createAssetAsync === 'function') {
          await MediaLibrary.createAssetAsync(localUri);
          saved = true;
        } else if (typeof MediaLibrary.saveToLibraryAsync === 'function') {
          await MediaLibrary.saveToLibraryAsync(localUri);
          saved = true;
        }
      } catch {}
    }

    if (!saved) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const legacyML = require('expo-media-library/legacy');
        if (typeof legacyML.createAssetAsync === 'function') {
          await legacyML.createAssetAsync(localUri);
          saved = true;
        } else if (typeof legacyML.saveToLibraryAsync === 'function') {
          await legacyML.saveToLibraryAsync(localUri);
          saved = true;
        }
      } catch (legacyErr) {
        console.warn('[saveQris] Legacy save failed:', legacyErr);
      }
    }

    if (saved) {
      Alert.alert(
        'QRIS Berhasil Disimpan! 📥',
        'Foto kode QRIS telah tersimpan di galeri foto perangkat kamu.\n\nSilakan buka aplikasi m-Banking atau e-Wallet pilihanmu, lalu pilih opsi scan dari galeri.',
        [{ text: 'OK' }],
      );
      return true;
    } else {
      Alert.alert(
        'Penyimpanan Dibatasi',
        'Foto QRIS belum dapat disimpan otomatis oleh sistem perangkat. Kamu bisa melakukan tangkapan layar (screenshot) kode QR ini untuk scan dari galeri.',
        [{ text: 'Mengerti' }],
      );
      return false;
    }
  } catch (error) {
    console.warn('[saveQris] Error saving QRIS:', error);
    Alert.alert(
      'Gagal Menyimpan QRIS',
      'Terjadi kendala saat menyimpan foto QRIS. Silakan ambil tangkapan layar (screenshot) kode QR ini.',
      [{ text: 'Mengerti' }],
    );
    return false;
  }
}

