import { apiRequest } from './client';
import type {
  BalanceHistoryResponse,
  BalanceResponse,
  MessageResponse,
  PendingTopupResponse,
  TopupCreateResponse,
  TopupStatusResponse,
} from './types';

export function getBalance() {
  return apiRequest<BalanceResponse>('/balance');
}

export function createTopup(amount: number) {
  return apiRequest<TopupCreateResponse>('/balance/topup', {
    method: 'POST',
    body: { amount: Math.round(amount) },
  });
}

export function getPendingTopup() {
  return apiRequest<PendingTopupResponse>('/balance/topup/pending');
}

export function cancelTopup(id?: string) {
  return apiRequest<MessageResponse>('/balance/topup/cancel', {
    method: 'POST',
    body: id ? { id } : {},
  });
}

export function getTopupStatus(id: string) {
  return apiRequest<TopupStatusResponse>(
    `/balance/topup/${encodeURIComponent(id)}/status`,
  );
}

export function getBalanceHistory(params: {
  page?: number;
  limit?: number;
  type?: string;
}) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.type && params.type !== 'ALL') query.set('type', params.type);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiRequest<BalanceHistoryResponse>(`/balance/history${suffix}`);
}
