import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Share,
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
import { colors, fonts, radius, spacing } from '@/theme/tokens';

type ReceiptModalProps = {
  visible: boolean;
  onClose: () => void;
  order: Order;
};

export function ReceiptModal({ visible, onClose, order }: ReceiptModalProps) {
  const [copied, setCopied] = useState(false);

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

  // Format teks rapi untuk dibagikan via WhatsApp / Clipboard
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
      `Produk      : ${order.product || '-'}`,
      `Varian      : ${order.variant || '-'}`,
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

  const handleShare = async () => {
    try {
      const text = generateReceiptText();
      await Share.share({
        title: `Struk Transaksi Noxarianet - ${order.id}`,
        message: text,
      });
    } catch {
      // Ignore share dismissal
    }
  };

  const handleCopy = async () => {
    try {
      const text = generateReceiptText();
      await Clipboard.setStringAsync(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
            {/* Struk Card Container */}
            <View style={styles.receiptPaper}>
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
                <ReceiptItem label="PRODUK" value={order.product || '-'} />
                <ReceiptItem label="NOMINAL / ITEM" value={order.variant || '-'} />
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
              <PrimaryButton
                onPress={() => void handleShare()}
                icon="share-variant-outline"
                style={styles.actionBtn}
              >
                Bagikan Struk (WhatsApp)
              </PrimaryButton>

              <SecondaryButton
                onPress={() => void handleCopy()}
                icon={copied ? 'check' : 'content-copy'}
                style={styles.actionBtn}
              >
                {copied ? 'Struk Berhasil Disalin!' : 'Salin Teks Struk'}
              </SecondaryButton>

              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}
              >
                <AppText style={styles.closeBtnText}>Tutup</AppText>
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
    backgroundColor: 'rgba(28, 25, 46, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalBox: {
    width: '100%',
    maxHeight: '92%',
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
    alignSelf: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  statusBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  dashedLine: {
    width: '100%',
    height: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginVertical: spacing.md,
  },
  infoSection: {
    gap: 10,
  },
  paymentSection: {
    marginTop: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  itemLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    flex: 1,
  },
  itemValue: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.ink,
    flex: 1.4,
    textAlign: 'right',
  },
  fontMono: {
    fontFamily: fonts.mono,
  },
  fontStrong: {
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  fontHighlight: {
    fontFamily: fonts.bold,
    color: colors.coralDark,
  },
  snCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
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
    color: '#155724',
    letterSpacing: 0.5,
  },
  snValue: {
    fontFamily: fonts.monoMedium,
    fontSize: 13,
    color: '#0D3816',
    fontWeight: 'bold',
  },
  financialSection: {
    gap: 6,
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
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
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
  },
  actionBtn: {
    width: '100%',
  },
  closeBtn: {
    paddingVertical: spacing.sm,
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

