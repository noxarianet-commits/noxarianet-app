/**
 * Noxarianet design tokens.
 *
 * Source of truth: DESIGN.md at the store repo root. Keep this file free of
 * component logic so a future dark theme can be added without touching screens.
 */

export const colors = {
  paper: '#F5F1E9',
  surface: '#FFFDF8',
  surfaceMuted: '#EFEAE0',
  ink: '#17212B',
  inkSoft: '#33414C',
  muted: '#68737B',
  mutedStrong: '#4F5B64',
  line: '#D9D4CA',
  lineStrong: '#B8B1A5',
  coral: '#E86B4F',
  coralDark: '#BD4933',
  coralSoft: '#F7E2DC',
  coralInk: '#5A1D12',
  teal: '#247D78',
  tealSoft: '#E4F1ED',
  tealInk: '#0F3D3A',
  gold: '#BD8828',
  goldSoft: '#F7EDD8',
  goldInk: '#5C3F0C',
  danger: '#BD4A43',
  dangerSoft: '#F9E3E0',
  dangerInk: '#4A1512',
  white: '#FFFDF8',
  scrim: 'rgba(23, 33, 43, 0.45)',
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
