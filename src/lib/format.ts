import { statusTones } from '@/theme/tokens';

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const MONTHS_LONG = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function formatNumber(value: number | null | undefined) {
  const safe = Number.isFinite(Number(value)) ? Math.round(Number(value)) : 0;
  return String(safe).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatRupiah(value: number | null | undefined) {
  return `Rp ${formatNumber(value)}`;
}

export function formatSignedRupiah(value: number, direction: 'in' | 'out') {
  return `${direction === 'in' ? '+' : '-'} ${formatRupiah(Math.abs(value))}`;
}

export function formatCompactRupiah(value: number | null | undefined) {
  const n = Number(value) || 0;
  if (n >= 1_000_000) {
    const millions = n / 1_000_000;
    return `Rp ${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1).replace('.', ',')} jt`;
  }
  if (n >= 10_000) return `Rp ${formatNumber(Math.round(n / 1000))} rb`;
  return formatRupiah(n);
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value?: string | null, withYear = true) {
  const date = parseDate(value);
  if (!date) return '—';
  const month = MONTHS_SHORT[date.getMonth()];
  return `${date.getDate()} ${month}${withYear ? ` ${date.getFullYear()}` : ''}`;
}

export function formatLongDate(value?: string | null) {
  const date = parseDate(value);
  if (!date) return '—';
  return `${date.getDate()} ${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatTime(value?: string | null) {
  const date = parseDate(value);
  if (!date) return '—';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}.${minutes}`;
}

export function formatDateTime(value?: string | null) {
  const date = parseDate(value);
  if (!date) return '—';
  return `${formatDate(value)}, ${formatTime(value)}`;
}

/**
 * Format tanggal dan waktu lengkap untuk struk resmi (termasuk jam, menit, detik dan zona WIB).
 */
export function formatFullReceiptDateTime(value?: string | null) {
  const date = parseDate(value);
  if (!date) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = MONTHS_LONG[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds} WIB`;
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTHS_LONG[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds} WIB`;
}

/**
 * Normalisasi metode bayar: hanya ada 2 metode: "Saldo Noxarianet" atau "QRIS".
 */
export function formatReceiptPaymentMethod(type?: string | null): 'Saldo Noxarianet' | 'QRIS' {
  if (!type) return 'Saldo Noxarianet';
  const clean = String(type).trim().toLowerCase();
  if (clean === 'balance' || clean.includes('saldo')) {
    return 'Saldo Noxarianet';
  }
  return 'QRIS';
}

export function formatCountdown(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${String(hours).padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function statusLabel(status?: string | null) {
  if (!status) return 'Tidak diketahui';
  return statusTones[status]?.label || status.replace(/_/g, ' ').toLowerCase();
}

export function getInitials(name?: string | null) {
  const clean = String(name || '').trim();
  if (!clean) return 'N';
  const parts = clean.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || '').join('') || 'N';
}

export function maskEmail(email: string) {
  const clean = email.trim();
  const [local, domain] = clean.split('@');
  if (!local || !domain) return clean;
  return `${local.slice(0, 1)}***@${domain}`;
}

export function firstName(name?: string | null) {
  return String(name || '').trim().split(/\s+/)[0] || 'Kak';
}

export function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}

export function normalizeWhatsAppNumber(raw?: string | null) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

export function pluralize(count: number, singular: string, plural?: string) {
  return `${count} ${count === 1 ? singular : plural || singular}`;
}
