import type { PublicSettings, SiteContent } from '@/api/types';
import { normalizeWhatsAppNumber } from '@/lib/format';

/** The backend can emit camelCase or snake_case site content. */
export function normalizeSiteContent(content?: SiteContent | null) {
  return {
    heroTitle:
      content?.hero_title ??
      content?.heroTitle ??
      'Top up & produk digital',
    heroSubtitle:
      content?.hero_subtitle ??
      content?.heroSubtitle ??
      'Cepat, aman, dan otomatis',
    heroDesc: content?.hero_desc ?? content?.heroDesc ?? '',
  };
}

export function supportWhatsAppNumber(settings?: PublicSettings | null) {
  return normalizeWhatsAppNumber(settings?.whatsapp_cs);
}

export function supportWhatsAppUrl(settings?: PublicSettings | null) {
  const number = supportWhatsAppNumber(settings);
  if (number) return `https://wa.me/${number}`;
  const fallback = process.env.EXPO_PUBLIC_SUPPORT_URL;
  return fallback || null;
}
