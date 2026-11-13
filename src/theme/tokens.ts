/**
 * Noxarianet design tokens.
 *
 * Source of truth: DESIGN.md at the store repo root. Keep this file free of
 * component logic so a future dark theme can be added without touching screens.
 */

export const colors = {
  paper: '#F8F7FC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1EEF8',
  ink: '#1C192E',
  inkSoft: '#332F47',
  muted: '#716B87',
  mutedStrong: '#4E4963',
  line: '#E7E2F1',
  lineStrong: '#CFC6E0',
  coral: '#4D1B8C',
  coralDark: '#381169',
  coralSoft: '#EDE7F6',
  coralInk: '#311059',
  teal: '#00BFA5',
  tealSoft: '#E0F7F4',
  tealInk: '#004D40',
  gold: '#BD8828',
  goldSoft: '#F7EDD8',
  goldInk: '#5C3F0C',
  danger: '#E53935',
  dangerSoft: '#FFEBEE',
  dangerInk: '#B71C1C',
  white: '#FFFFFF',
  scrim: 'rgba(28, 25, 46, 0.45)',
} as const;

export const fonts = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
  mono: 'DMMono_400Regular',
  monoMedium: 'DMMono_500Medium',
} as const;

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const layout = {
  screenPadding: 20,
  maxContentWidth: 560,
  tabBarHeight: 64,
  minTouch: 48,
} as const;

export type StatusTone = {
  label: string;
  fg: string;
  bg: string;
  icon: string;
};

export const statusTones: Record<string, StatusTone> = {
  PENDING: {
    label: 'Menunggu bayar',
    fg: colors.goldInk,
    bg: colors.goldSoft,
    icon: 'clock-outline',
  },
  PROCESSING_LOCK: {
    label: 'Diproses',
    fg: colors.tealInk,
    bg: colors.tealSoft,
    icon: 'progress-clock',
  },
  PROCESSING: {
    label: 'Diproses',
    fg: colors.tealInk,
    bg: colors.tealSoft,
    icon: 'progress-clock',
  },
  COMPLETED: {
    label: 'Selesai',
    fg: colors.tealInk,
    bg: colors.tealSoft,
    icon: 'check-circle-outline',
  },
  FAILED: {
    label: 'Gagal',
    fg: colors.dangerInk,
    bg: colors.dangerSoft,
    icon: 'alert-circle-outline',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    fg: colors.mutedStrong,
    bg: colors.surfaceMuted,
    icon: 'close-circle-outline',
  },
  REFUND_PENDING: {
    label: 'Refund diproses',
    fg: colors.goldInk,
    bg: colors.goldSoft,
    icon: 'cash-refund',
  },
  REFUNDED: {
    label: 'Dana dikembalikan',
    fg: colors.tealInk,
    bg: colors.tealSoft,
    icon: 'cash-check',
  },
};

export const orderStatusFilters = [
  { key: 'ALL', label: 'Semua' },
  { key: 'PENDING', label: 'Menunggu' },
  { key: 'PROCESSING', label: 'Diproses' },
  { key: 'COMPLETED', label: 'Selesai' },
  { key: 'FAILED', label: 'Gagal' },
] as const;

export const isFinalOrderStatus = (status?: string | null) =>
  !!status && ['COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'].includes(status);
