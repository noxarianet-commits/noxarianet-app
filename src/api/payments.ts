import { apiRequest } from './client';
import type { PaymentStatusResponse } from './types';

/**
 * Payment status lives outside /mobile. Non-slim responses include the full
 * order row (including pg_qr_link), which is the fallback when the locally
 * cached QR is missing.
 */
export function getPaymentStatus(orderId: string, force = false) {
  const query = force ? '?force=true' : '';
  return apiRequest<PaymentStatusResponse>(
    `/payments/status/${encodeURIComponent(orderId)}${query}`,
  );
}
