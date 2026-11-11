export const queryKeys = {
  config: ['config'] as const,
  me: ['me'] as const,
  home: ['home'] as const,
  products: (filters: {
    search: string;
    category: string;
    type: string;
  }) => ['products', filters] as const,
  product: (id: string) => ['product', id] as const,
  orders: (status: string) => ['orders', status] as const,
  order: (id: string) => ['order', id] as const,
  paymentStatus: (id: string) => ['payment-status', id] as const,
  balance: ['balance'] as const,
  topupPending: ['topup-pending'] as const,
  topupStatus: (ref: string) => ['topup-status', ref] as const,
  balanceHistory: (type: string) => ['balance-history', type] as const,
};
