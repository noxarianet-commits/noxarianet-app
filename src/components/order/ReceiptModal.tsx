import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Clipboard from 'expo-clipboard';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import type { Order } from '@/api/types';
import { AppLogo } from '@/components/ui/AppLogo';
import { AppText } from '@/components/ui/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Buttons';
import {
  formatFullReceiptDateTime,
  formatReceiptPaymentMethod,
  formatRupiah,
  statusLabel,
} from '@/lib/format';
import { cleanProductName } from '@/lib/products';
import { colors, fonts, radius, spacing } from '@/theme/tokens';

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

const WATERMARK_ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

type ReceiptModalProps = {
  visible: boolean;
  onClose: () => void;
  order: Order;
};

export function ReceiptModal({ visible, onClose, order }: ReceiptModalProps) {
  const receiptPaperRef = useRef<React.ElementRef<typeof View>>(null);
  const [copied, setCopied] = useState(false);
  const [savingImage, setSavingImage] = useState(false);

  const details = order.account_details || {};
  const isPostpaid = order.order_type === 'postpaid' || details.type === 'postpaid';
  const target =
    details.customer_number ||
    details.customer_id ||
    details.user_id ||
    details.target ||
    details.note;
  const serial = details.sn || details.serial_number;
  const licenses = Array.isArray(details.licenses) ? details.licenses : [];
  const paymentMethod = formatReceiptPaymentMethod(order.payment_type);
  const formattedTime = formatFullReceiptDateTime(order.timestamp);
  const isSuccess = order.status === 'COMPLETED';

  // Format teks rapi untuk Clipboard
  const generateReceiptText = () => {
    const lines = [
      '================================',
      '     STRUK TRANSAKSI RESMI      ',
      '          NOXARIANET            ',
      '================================',
      `Status      : ${isSuccess ? 'BERHASIL' : statusLabel(order.status).toUpperCase()}`,
      `Waktu       : ${formattedTime}`,
      `No. Invoice : ${order.id}`,
      '--------------------------------',
      `Produk      : ${cleanProductName(order.product) || '-'}`,
      `Varian      : ${cleanProductName(order.variant) || '-'}`,
    ];

    if (target) {
      lines.push(`No. Tujuan  : ${target}`);
    }
    if (isPostpaid && details.customer_name) {
      lines.push(`Nama Plg    : ${details.customer_name}`);
    }
    if (isPostpaid && details.bill_period) {
      lines.push(`Periode     : ${details.bill_period}`);
    }
    if (serial) {
      lines.push(`SN / Bukti  : ${serial}`);
    }
    if (licenses.length > 0) {
      licenses.forEach((lic, i) => {
        lines.push(`Kode ${i + 1}      : ${lic}`);
      });
    }

    lines.push(`Metode Bayar: ${paymentMethod}`);
    lines.push('--------------------------------');
    lines.push(`Harga       : ${formatRupiah(order.price)}`);
    if (order.fee) {
      lines.push(`Biaya Admin : ${formatRupiah(order.fee)}`);
    }
    lines.push(`Total Bayar : ${formatRupiah(order.total ?? order.price)}`);
    lines.push('================================');
    lines.push('Struk ini merupakan bukti sah.');
    lines.push('Terima kasih telah bertransaksi di Noxarianet!');

    return lines.join('\n');
  };

  // Simpan foto struk langsung ke galeri perangkat
  const handleSaveImage = async () => {
    if (savingImage) return;

    try {
      setSavingImage(true);

      if (!captureRef || !MediaLibrary) {
        Alert.alert(
          'Modul Penyimpanan Perlu Dipasang',
          'Untuk mengaktifkan penyimpanan foto struk ke galeri, silakan jalankan perintah ini di terminal:\n\nnpx expo install expo-media-library react-native-view-shot\n\nKamu juga dapat langsung menyalin teks struk menggunakan tombol "Salin Teks Struk".',
          [
            { text: 'Salin Teks Saja', onPress: () => void handleCopy() },
            { text: 'Tutup', style: 'cancel' },
          ],
        );
        return;
      }

      // 1. Cek & minta izin akses foto/galeri secara aman (hanya 'photo', jangan pernah meminta audio/video)
      try {
        if (MediaLibrary?.getPermissionsAsync) {
          const check = await MediaLibrary.getPermissionsAsync(true, ['photo']).catch(() => null);
          if (
            !check?.granted &&
            check?.status !== 'granted' &&
            check?.accessPrivileges !== 'all' &&
            check?.accessPrivileges !== 'limited'
          ) {
            if (MediaLibrary?.requestPermissionsAsync) {
              await MediaLibrary.requestPermissionsAsync(true, ['photo']).catch(() => null);
            }
          }
        }
      } catch (permErr) {
        // Abaikan error pengecekan izin (misal di Expo Go yang membatasi API MediaLibrary)
        // Pada Android 10+ (API 29+ Scoped Storage), MediaStore ContentResolver dapat membuat file gambar tanpa izin baca eksplisit
        console.warn('[ReceiptModal] Permission check ignored, attempting direct save:', permErr);
      }

      // 2. Capture tampilan struk menjadi gambar PNG beresolusi tinggi
      if (!receiptPaperRef.current) {
        Alert.alert('Gagal', 'Tampilan struk belum siap untuk disimpan.');
        return;
      }

      const localUri = await captureRef(receiptPaperRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      // 3. Simpan langsung ke galeri foto perangkat (kompatibel SDK 52/53/58+ & legacy)
      let saved = false;

      // Coba class-based Asset.create (Expo SDK 52/58 Next API)
      if (MediaLibrary?.Asset && typeof MediaLibrary.Asset.create === 'function') {
        try {
          await MediaLibrary.Asset.create(localUri);
          saved = true;
        } catch (assetErr) {
          console.warn('[ReceiptModal] MediaLibrary.Asset.create failed:', assetErr);
        }
      }

      // Fallback ke method biasa atau legacy module jika Asset.create belum berhasil
      if (!saved && MediaLibrary) {
        try {
          if (typeof MediaLibrary.createAssetAsync === 'function') {
            await MediaLibrary.createAssetAsync(localUri);
            saved = true;
          } else if (typeof MediaLibrary.saveToLibraryAsync === 'function') {
            await MediaLibrary.saveToLibraryAsync(localUri);
            saved = true;
          }
        } catch {
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
            console.warn('[ReceiptModal] Legacy save failed:', legacyErr);
          }
        }
      }

      if (!saved) {
        Alert.alert(
          'Tidak Dapat Menyimpan Foto',
          'Penyimpanan otomatis ke galeri dibatasi oleh sistem perangkat atau mode aplikasi. Silakan salin teks struk sebagai bukti transaksi yang sah.',
          [
            { text: 'Salin Teks Struk', onPress: () => void handleCopy() },
            { text: 'Tutup', style: 'cancel' },
          ],
        );
        return;
      }

      Alert.alert(
        'Struk Berhasil Disimpan! 🎉',
        'Foto bukti transaksi telah tersimpan di galeri foto perangkat kamu.',
        [{ text: 'Selesai' }],
      );
    } catch (error) {
      console.warn('[ReceiptModal] Save receipt error:', error);
      Alert.alert(
        'Penyimpanan Dibatasi',
        'Foto struk belum dapat disimpan ke galeri foto pada perangkat kamu. Kamu tetap dapat menyalin seluruh data struk ini secara instan.',
        [
          { text: 'Salin Teks Struk', onPress: () => void handleCopy() },
          { text: 'Tutup', style: 'cancel' },
        ],
      );
    } finally {
      setSavingImage(false);
    }
  };

  const handleCopy = async () => {
    try {
      const text = generateReceiptText();
      await Clipboard.setStringAsync(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore clipboard error
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Struk Card Container (Captured as Image) */}
            <View
              ref={receiptPaperRef}
              collapsable={false}
              style={styles.receiptPaper}
            >
              {/* Background Watermark Anti-Counterfeit (DANA Style) */}
              <View
                style={styles.watermarkLayer}
                pointerEvents="none"
                aria-hidden={true}
              >
                {WATERMARK_ROWS.map((idx) => (
                  <View key={idx} style={styles.watermarkRow}>
                    <AppText style={styles.watermarkText}>NOXARIANET</AppText>
                    <AppText style={styles.watermarkText}>NOXARIANET</AppText>
                    <AppText style={styles.watermarkText}>NOXARIANET</AppText>
                  </View>
                ))}
              </View>

              {/* Header Struk */}
              <View style={styles.receiptHeader}>
                <AppLogo size={42} />
                <AppText style={styles.receiptBrand}>NOXARIANET</AppText>
                <AppText style={styles.receiptSub}>BUKTI TRANSAKSI RESMI</AppText>
              </View>

              {/* Status Badge */}
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isSuccess ? '#E8F5E9' : colors.surfaceMuted,
                    borderColor: isSuccess ? '#2E7D32' : colors.line,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={isSuccess ? 'check-decagram' : 'clock-outline'}
                  size={16}
                  color={isSuccess ? '#2E7D32' : colors.muted}
                />
                <AppText
                  style={[
                    styles.statusBadgeText,
                    { color: isSuccess ? '#1B5E20' : colors.ink },
                  ]}
                >
                  {isSuccess ? 'TRANSAKSI BERHASIL' : statusLabel(order.status).toUpperCase()}
                </AppText>
              </View>

              {/* Garis putus-putus atas */}
              <View style={styles.dashedLine} />

              {/* Bagian Rincian Bukti & Waktu */}
              <View style={styles.infoSection}>
                <ReceiptItem label="WAKTU TRANSAKSI" value={formattedTime} strong />
                <ReceiptItem label="NO. INVOICE" value={order.id} mono />
                <ReceiptItem label="PRODUK" value={cleanProductName(order.product) || '-'} />
                <ReceiptItem label="NOMINAL / ITEM" value={cleanProductName(order.variant) || '-'} />
                {target ? <ReceiptItem label="NO. TUJUAN / AKUN" value={String(target)} strong /> : null}
                {isPostpaid && details.customer_name ? (
                  <ReceiptItem label="NAMA PELANGGAN" value={String(details.customer_name)} />
                ) : null}
                {isPostpaid && details.bill_period ? (
                  <ReceiptItem label="PERIODE" value={String(details.bill_period)} />
                ) : null}
              </View>

              {/* Serial Number / Token PLN jika ada */}
              {serial ? (
                <View style={styles.snCard}>
                  <View style={styles.snHead}>
                    <MaterialCommunityIcons name="check-all" size={14} color="#155724" />
                    <AppText style={styles.snLabel}>SERIAL NUMBER (SN) / TOKEN</AppText>
                  </View>
                  <AppText style={styles.snValue} selectable>
                    {String(serial)}
                  </AppText>
                </View>
              ) : null}

              {/* Kode Voucher / Lisensi */}
              {licenses.length > 0 ? (
                <View style={styles.snCard}>
                  <AppText style={styles.snLabel}>KODE VOUCHER / LISENSI</AppText>
                  {licenses.map((lic, idx) => (
                    <AppText key={idx} style={styles.snValue} selectable>
                      {lic}
                    </AppText>
                  ))}
                </View>
              ) : null}

              {/* Metode Pembayaran (Hanya Saldo Noxarianet atau QRIS) */}
              <View style={styles.paymentSection}>
                <ReceiptItem
                  label="METODE PEMBAYARAN"
                  value={paymentMethod}
                  highlight
                />
              </View>

              {/* Garis putus-putus */}
              <View style={styles.dashedLine} />

              {/* Rincian Finansial */}
              <View style={styles.financialSection}>
                <View style={styles.priceRow}>
                  <AppText style={styles.priceLabel}>Harga Produk</AppText>
                  <AppText style={styles.priceVal}>{formatRupiah(order.price)}</AppText>
                </View>
                {order.fee ? (
                  <View style={styles.priceRow}>
                    <AppText style={styles.priceLabel}>Biaya Layanan</AppText>
                    <AppText style={styles.priceVal}>{formatRupiah(order.fee)}</AppText>
                  </View>
                ) : null}
                <View style={styles.totalRow}>
                  <AppText style={styles.totalLabel}>TOTAL BAYAR</AppText>
                  <AppText style={styles.totalVal}>
                    {formatRupiah(order.total ?? order.price)}
                  </AppText>
                </View>
              </View>

              {/* Garis putus-putus bawah */}
              <View style={styles.dashedLine} />

              {/* Footer Struk */}
              <View style={styles.receiptFooter}>
                <AppText style={styles.footerThanks}>
                  Terima kasih telah bertransaksi di Noxarianet!
                </AppText>
                <AppText style={styles.footerLegal}>
                  Struk ini merupakan bukti pembayaran elektronik yang sah dan diterbitkan otomatis oleh sistem Noxarianet.
                </AppText>
              </View>
            </View>

            {/* Tombol Aksi di Luar Struk */}
            <View style={styles.modalActions}>
              {/* Tombol Utama: Simpan Foto Struk ke Galeri */}
              <PrimaryButton
                onPress={() => void handleSaveImage()}
                loading={savingImage}
                disabled={savingImage}
                icon="download"
                style={styles.saveBtn}
              >
                {savingImage ? 'Menyimpan ke Galeri…' : 'Simpan Foto Struk ke Perangkat'}
              </PrimaryButton>

              {/* Tombol Sekunder: Salin Teks Struk (Tegas & Jelas) */}
              <SecondaryButton
                onPress={() => void handleCopy()}
                icon={copied ? 'check-bold' : 'content-copy'}
                textColor={copied ? '#155724' : colors.coralDark}
                style={[
                  styles.copyBtn,
                  copied && styles.copyBtnSuccess,
                ]}
              >
                {copied ? 'Teks Struk Berhasil Disalin!' : 'Salin Teks Struk Saja'}
              </SecondaryButton>

              {/* Keterangan Bantuan */}
              <AppText variant="bodySmall" style={styles.actionsHint}>
                Gunakan &quot;Simpan Foto Struk&quot; untuk galeri, atau &quot;Salin Teks&quot; untuk pesan chat.
              </AppText>

              {/* Tombol Tutup */}
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              >
                <AppText style={styles.closeBtnText}>Tutup Struk</AppText>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ReceiptItem({
  label,
  value,
  mono,
  strong,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  strong?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={styles.itemRow}>
      <AppText style={styles.itemLabel}>{label}</AppText>
      <AppText
        style={[
          styles.itemValue,
          mono && styles.fontMono,
          strong && styles.fontStrong,
          highlight && styles.fontHighlight,
        ]}
      >
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 25, 46, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalBox: {
    width: '100%',
    maxHeight: '94%',
    backgroundColor: 'transparent',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  receiptPaper: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  watermarkLayer: {
    position: 'absolute',
    top: -100,
    bottom: -100,
    left: -120,
    right: -120,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    transform: [{ rotate: '-22deg' }],
    opacity: 0.05,
    zIndex: 0,
  },
  watermarkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  watermarkText: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    letterSpacing: 3,
    color: colors.coralDark,
  },
  receiptHeader: {
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.sm,
  },
  receiptBrand: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    letterSpacing: 1.5,
    color: colors.ink,
    marginTop: 2,
  },
  receiptSub: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 0.8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    alignSelf: 'center',
  },
  statusBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  dashedLine: {
    borderStyle: 'dashed',
    borderWidth: 0.8,
    borderColor: '#CBD5E1',
    marginVertical: spacing.md,
  },
  infoSection: {
    gap: spacing.sm,
  },
  paymentSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
  },
  snCard: {
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#C6F6D5',
    borderRadius: radius.sm,
    padding: spacing.sm + 2,
    marginTop: spacing.sm,
    gap: 4,
  },
  snHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  snLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: '#22543D',
    letterSpacing: 0.5,
  },
  snValue: {
    fontFamily: fonts.monoMedium,
    fontSize: 13,
    color: '#155724',
    letterSpacing: 0.8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  itemLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.muted,
    flex: 1,
  },
  itemValue: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.ink,
    textAlign: 'right',
    flex: 1.5,
  },
  fontMono: {
    fontFamily: fonts.monoMedium,
    fontSize: 11.5,
  },
  fontStrong: {
    fontFamily: fonts.semiBold,
    color: colors.ink,
  },
  fontHighlight: {
    fontFamily: fonts.bold,
    color: colors.coralDark,
  },
  financialSection: {
    gap: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
  },
  priceVal: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.ink,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
  },
  totalLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
  },
  totalVal: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    color: colors.coralDark,
  },
  receiptFooter: {
    alignItems: 'center',
    gap: 4,
    paddingTop: spacing.xs,
  },
  footerThanks: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.ink,
    textAlign: 'center',
  },
  footerLegal: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 14,
  },
  modalActions: {
    width: '100%',
    marginTop: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
  },
  saveBtn: {
    width: '100%',
    backgroundColor: colors.coralDark,
    borderRadius: radius.md,
  },
  copyBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderColor: colors.coral,
    borderWidth: 1.5,
    borderRadius: radius.md,
  },
  copyBtnSuccess: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
  },
  actionsHint: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  closeBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  closeBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.7,
  },
});
