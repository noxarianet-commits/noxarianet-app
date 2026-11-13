/**
 * Types for the mobile API contract in docs/mobile-api.md.
 *
 * The backend mixes a few response envelopes (mobile, auth, validation, payment
 * status, balance). Each API function narrows to the shape it actually returns.
 */

export type ShopStatus = {
  isOpen: boolean;
  message?: string;
};

export type SiteContent = {
  hero_title?: string;
  hero_subtitle?: string;
  hero_desc?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroDesc?: string;
};

export type MobileConfig = {
  min_version: string;
  latest_version: string;
  maintenance: boolean;
  features: {
    bills?: boolean;
    topup?: boolean;
    tickets?: boolean;
  };
  payment_methods: string[];
  /** Flag efektif "Wajib Validasi Akun" untuk channel app. */
  mandatory_validation?: boolean;
  shop_status?: ShopStatus;
};

export type UserProfile = {
  id: string;
  email: string;
  phone: string | null;
  display_name: string;
  balance: number;
  balance_limit?: number;
  is_active: boolean;
  email_verified: boolean;
  created_at?: string;
};

export type LoginResponse = {
  success: true;
  token: string;
  user: UserProfile;
};

export type MeResponse = {
  success: true;
  user: UserProfile;
};

export type RegisterStartResponse = {
  success: true;
  requires_verification: true;
  email: string;
  masked_email: string;
  expires_in: number;
  resend_available_in: number;
};

export type OtpSentResponse = {
  success: true;
  masked_email?: string;
  message?: string;
  expires_in?: number;
  resend_available_in?: number;
};

export type MessageResponse = {
  success: true;
  message: string;
};

// ── Push notification devices ──────────────────────────────────────────────

export type RegisterDevicePayload = {
  push_token: string;
  platform?: 'android' | 'ios' | 'web';
  app_version?: string;
};

export type RegisterDeviceResponse = {
  success: true;
  data: { registered: boolean };
};

export type DeviceListResponse = {
  success: true;
  data: { devices: DeviceInfo[] };
};

export type DeviceInfo = {
  id: string;
  platform: string;
  app_version: string | null;
  active: boolean;
  last_seen_at: string;
  created_at: string;
};

export type HomeCategory = {
  slug: string;
  name: string;
  icon: string | null;
  product_count: number;
  type: string;
};

export type Testimonial = {
  id: number;
  name: string;
  rating: number;
  text: string;
  created_at?: string;
};

export type QuickAction = {
  key: string;
  label: string;
};

export type PublicSettings = {
  shop_status?: ShopStatus;
  site_content?: SiteContent;
  wa_group_link?: string;
  whatsapp_cs?: string;
  info_modal_active?: boolean;
  info_modal_text?: string;
  info_modal_image?: string | null;
  payment_gateway?: string;
};

export type HomeData = {
  settings: PublicSettings;
  categories: HomeCategory[];
  prepaid_categories: HomeCategory[];
  bill_categories: HomeCategory[];
  featured_products: Product[];
  testimonials: Testimonial[];
  quick_actions: QuickAction[];
};

export type RequiredField = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
};

export type VariantValidation = {
  available?: boolean;
  type?: string;
};

export type ProviderMeta = {
  open_denom?: boolean;
  min_qty?: number;
  max_qty?: number;
  [key: string]: unknown;
};

export type ProductVariant = {
  id: string;
  db_id?: number;
  product_id: number;
  vendor?: string;
  sku?: string | null;
  name: string;
  price: number;
  sell_price?: number;
  admin_fee?: number;
  stock: number;
  order_process?: string;
  required_fields?: RequiredField[];
  validation?: VariantValidation;
  provider_meta?: ProviderMeta;
  note?: string;
};

export type ProductServer = {
  vendor: string;
  server_name: string;
  product_id: number;
  variants: ProductVariant[];
};

export type Product = {
  id: number;
  vendor?: string;
  external_id?: string;
  canonical_key?: string;
  category: string;
  name: string;
  brand?: string | null;
  icon?: string | null;
  image?: string | null;
  is_active?: boolean;
  is_featured?: boolean;
  product_type?: string;
  is_postpaid?: boolean;
  variants?: ProductVariant[];
  servers?: ProductServer[];
  requested_vendor?: string;
  synced_at?: string;
  created_at?: string;
};

export type ProductListMeta = {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
};

export type ProductListResponse = {
  success: true;
  data: Product[];
  meta: ProductListMeta;
};

export type ProductDetailResponse = {
  success: true;
  data: Product;
};

export type ValidateProductPayload = {
  product_id: number | string;
  variant_id: string;
  customer_id: string;
  zone_id?: string;
};

export type ValidateProductResponse = {
  valid: boolean;
  validation_available?: boolean;
  account_name?: string;
  display_name?: string;
  message?: string;
};

export type BillInquiryPayload = {
  product_id: number;
  variant_id: string;
  customer_number: string;
};

/** Quote sementara dari cek tagihan. Berlaku 10 menit. */
export type BillQuote = {
  inquiry_id: string;
  expires_at: string;
  product: {
    id: number;
    name: string;
    category: string;
    product_type: string;
  };
  variant: {
    id: string;
    db_id: number;
    name: string;
  };
  customer: {
    number: string;
    name: string | null;
  };
  bill: {
    period: string | null;
    amount: number;
    admin_fee: number;
    total: number;
  };
  payment_methods: string[];
};

export type BillInquiryResponse = {
  success: true;
  reused?: boolean;
  data: BillQuote;
};

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING_LOCK'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export type AccountDetails = {
  vendor?: string;
  note?: string | null;
  target?: string | null;
  customer_id?: string | null;
  user_id?: string | null;
  zone_id?: string | null;
  provider_qty?: number | null;
  sn?: string | null;
  serial_number?: string | null;
  licenses?: string[] | null;
  vendor_status_raw?: string | null;
  completed_at?: string | null;
  type?: string;
  postpaid?: boolean;
  customer_number?: string | null;
  customer_name?: string | null;
  bill_period?: string | null;
  bill_amount?: number | null;
  admin_fee?: number | null;
  total_amount?: number | null;
  inquiry_id?: string | null;
  [key: string]: unknown;
};

export type Order = {
  id: string;
  product: string;
  variant: string;
  price: number;
  status: OrderStatus | string;
  payment_method: 'BALANCE' | 'QRIS' | string;
  payment_type: 'balance' | 'gateway' | string;
  pg_provider: string;
  pg_invoice?: string | null;
  pg_paid_at?: string | null;
  pg_expired_at?: string | null;
  pg_qr_link?: string | null;
  pg_total?: number | null;
  error_message?: string | null;
  account_details?: AccountDetails | null;
  timestamp: string;
  channel?: string;
  order_type?: string;
  unique_code?: number | null;
  fee?: number | null;
  total?: number | null;
  payment_code?: string | null;
  payment_link?: string | null;
  user_id?: string;
};

export type OrderListMeta = {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
};

export type OrderListResponse = {
  success: true;
  data: Order[];
  meta: OrderListMeta;
};

export type OrderDetailResponse = {
  success: true;
  data: Order;
};

export type CreateOrderPayload =
  | {
      type: 'prepaid';
      product_id: number | string;
      variant_id: string;
      fields: Record<string, string>;
      payment_type: 'balance' | 'gateway';
    }
  | {
      type: 'bill';
      inquiry_id: string;
      payment_type: 'balance';
    };

export type CreatedOrder = {
  order_id: string;
  access_token?: string;
  invoice?: string;
  amount: number;
  unique_code?: number;
  fee?: number;
  total?: number;
  payment_code?: string;
  payment_link?: string;
  qr_link?: string;
  status: string;
  pg_provider: string;
  payment_type: string;
  product?: string;
  variant?: string;
  created_at?: string;
};

export type CreateOrderResponse = {
  success: true;
  idempotent?: boolean;
  data: CreatedOrder;
};

export type CancelOrderResponse = {
  success: true;
  message: string;
};

export type PaymentStatusResponse = {
  data: Order & {
    email?: string | null;
    wa_number?: string | null;
    customer_name?: string | null;
  };
};

export type BalanceSummary = {
  balance: number;
  balance_limit: number;
};

export type BalanceResponse = {
  success: true;
  data: BalanceSummary;
};

export type TopupCreateResponse = {
  success: true;
  topup_id: string;
  qr_link: string;
  total: number;
  pg_provider: string;
  status: string;
  amount: number;
};

export type TopupRecord = {
  id: string;
  user_id?: string;
  type?: string;
  amount: number;
  balance_before?: number;
  balance_after?: number;
  reference_id: string;
  status: string;
  description?: string;
  pg_provider?: string;
  pg_invoice?: string;
  pg_qr_link?: string | null;
  pg_total?: number;
  pg_expired_at?: string | null;
  created_at?: string;
  credited_at?: string;
};

export type PendingTopupResponse = {
  success: true;
  data: TopupRecord | null;
};

export type TopupStatusResponse = {
  success: true;
  status: string;
  data: TopupRecord;
};

export type BalanceTransaction = TopupRecord & {
  amount: number;
  balance_before: number;
  balance_after: number;
};

export type BalancePagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type BalanceHistoryResponse = {
  success: true;
  data: BalanceTransaction[];
  pagination: BalancePagination;
};

export type CachedPaymentInfo = {
  orderId: string;
  qrLink?: string | null;
  total: number;
  uniqueCode?: number | null;
  fee?: number | null;
  expiresAt?: string | null;
  paymentType: 'balance' | 'gateway' | string;
  createdAt: string;
};

export type CachedTopupInfo = {
  ref: string;
  id?: string;
  qrLink: string;
  total: number;
  amount?: number;
  expiresAt?: string | null;
  createdAt: string;
};
