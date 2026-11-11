import { apiRequest } from './client';
import type {
  BillInquiryPayload,
  BillInquiryResponse,
  CancelOrderResponse,
  CreateOrderPayload,
  CreateOrderResponse,
  HomeData,
  LoginResponse,
  MeResponse,
  MessageResponse,
  MobileConfig,
  OrderDetailResponse,
  OrderListResponse,
  OtpSentResponse,
  ProductDetailResponse,
  ProductListResponse,
  RegisterStartResponse,
  UserProfile,
  ValidateProductPayload,
  ValidateProductResponse,
} from './types';

function queryString(params: Record<string, string | number | undefined>) {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== '',
  );
  if (!entries.length) return '';
  return `?${entries
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join('&')}`;
}

// ── Config ────────────────────────────────────────────────────────────────

export function getConfig() {
  return apiRequest<{ success: true; data: MobileConfig }>('/mobile/config', {
    auth: false,
  });
}

// ── Auth ──────────────────────────────────────────────────────────────────

export function login(email: string, password: string) {
  return apiRequest<LoginResponse>('/mobile/auth/login', {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), password },
    auth: false,
  });
}

export function register(input: {
  email: string;
  phone: string;
  display_name: string;
  password: string;
}) {
  return apiRequest<RegisterStartResponse>('/mobile/auth/register', {
    method: 'POST',
    body: {
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim().replace(/[\s-]/g, ''),
      display_name: input.display_name.trim(),
      password: input.password,
    },
    auth: false,
  });
}

export function verifyRegistration(email: string, code: string) {
  return apiRequest<LoginResponse>('/mobile/auth/register/verify', {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), code },
    auth: false,
  });
}

export function resendRegistration(email: string) {
  return apiRequest<OtpSentResponse>('/mobile/auth/register/resend', {
    method: 'POST',
    body: { email: email.trim().toLowerCase() },
    auth: false,
  });
}

export function forgotPassword(email: string) {
  return apiRequest<OtpSentResponse>('/mobile/auth/forgot-password', {
    method: 'POST',
    body: { email: email.trim().toLowerCase() },
    auth: false,
  });
}

export function resendForgotPassword(email: string) {
  return apiRequest<OtpSentResponse>('/mobile/auth/forgot-password/resend', {
    method: 'POST',
    body: { email: email.trim().toLowerCase() },
    auth: false,
  });
}

export function verifyForgotPassword(input: {
  email: string;
  code: string;
  new_password: string;
}) {
  return apiRequest<MessageResponse>('/mobile/auth/forgot-password/verify', {
    method: 'POST',
    body: {
      email: input.email.trim().toLowerCase(),
      code: input.code,
      new_password: input.new_password,
    },
    auth: false,
  });
}

// ── Profile ───────────────────────────────────────────────────────────────

export function getMe() {
  return apiRequest<MeResponse>('/mobile/me');
}

export function updateMe(input: {
  display_name?: string;
  phone?: string;
}) {
  const body: { display_name?: string; phone?: string } = {};
  if (input.display_name !== undefined) {
    body.display_name = input.display_name.trim();
  }
  if (input.phone !== undefined) {
    body.phone = input.phone.trim().replace(/[\s-]/g, '');
  }

  return apiRequest<MeResponse>('/mobile/me', {
    method: 'PUT',
    body,
  });
}

export function changePassword(input: {
  current_password: string;
  new_password: string;
}) {
  return apiRequest<MessageResponse>('/mobile/me/password', {
    method: 'PUT',
    body: input,
    notifyAuthError: false,
  });
}

// ── Catalog ───────────────────────────────────────────────────────────────

export function getHome() {
  return apiRequest<{ success: true; data: HomeData }>('/mobile/home');
}

export function getProducts(params: {
  type?: 'prepaid' | 'postpaid';
  category?: string;
  search?: string;
  page?: number;
  per_page?: number;
}) {
  return apiRequest<ProductListResponse>(
    `/mobile/products${queryString({
      type: params.type,
      category: params.category,
      search: params.search,
      page: params.page,
      per_page: params.per_page,
    })}`,
  );
}

export function getProduct(id: number | string) {
  return apiRequest<ProductDetailResponse>(
    `/mobile/products/${encodeURIComponent(String(id))}`,
  );
}

export function validateProduct(payload: ValidateProductPayload) {
  return apiRequest<ValidateProductResponse>('/mobile/products/validate', {
    method: 'POST',
    body: payload,
  });
}

// ── Tagihan (postpaid) ─────────────────────────────────────────────────────

export function inquiryBill(payload: BillInquiryPayload) {
  return apiRequest<BillInquiryResponse>('/mobile/bills/inquiry', {
    method: 'POST',
    body: {
      product_id: payload.product_id,
      variant_id: String(payload.variant_id),
      customer_number: payload.customer_number.trim(),
    },
  });
}

// ── Orders ────────────────────────────────────────────────────────────────

export function createOrder(
  payload: CreateOrderPayload,
  idempotencyKey: string,
) {
  return apiRequest<CreateOrderResponse>('/mobile/orders', {
    method: 'POST',
    body: payload,
    headers: { 'Idempotency-Key': idempotencyKey },
  });
}

export function getOrders(params: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return apiRequest<OrderListResponse>(
    `/mobile/orders${queryString({
      page: params.page,
      limit: params.limit,
      status: params.status && params.status !== 'ALL' ? params.status : undefined,
    })}`,
  );
}

export function getOrder(id: string, force = false) {
  return apiRequest<OrderDetailResponse>(
    `/mobile/orders/${encodeURIComponent(id)}${force ? '?force=true' : ''}`,
  );
}

export function cancelOrder(id: string) {
  return apiRequest<CancelOrderResponse>(
    `/mobile/orders/${encodeURIComponent(id)}/cancel`,
    { method: 'POST' },
  );
}

// ── Profile helpers ───────────────────────────────────────────────────────

export function displayNameOf(user?: Pick<UserProfile, 'display_name'> | null) {
  return user?.display_name?.trim() || 'Pengguna';
}
