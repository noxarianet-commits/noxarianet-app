import { getAuthToken, notifyUnauthorized } from './authToken';

const rawBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://staging.noxarianet.web.id/api';

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

type ApiErrorBody = {
  success?: false;
  code?: string;
  error?: string;
  message?: string;
  retry_after?: number;
  request_id?: string;
};

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Set to false for public endpoints so a 401 does not clear the session. */
  auth?: boolean;
  /** Set to false for endpoints where a 401 is a validation error (e.g. wrong current password). */
  notifyAuthError?: boolean;
  timeoutMs?: number;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly retryAfter?: number;
  readonly requestId?: string;
  readonly payload?: unknown;

  constructor(
    message: string,
    options: {
      status: number;
      code?: string;
      retryAfter?: number;
      requestId?: string;
      payload?: unknown;
    },
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.retryAfter = options.retryAfter;
    this.requestId = options.requestId;
    this.payload = options.payload;
  }

  get isNetworkError() {
    return this.status === 0;
  }

  get isAuthError() {
    return (
      this.status === 401 ||
      this.code === 'AUTH_REQUIRED' ||
      this.code === 'APP_ONLY'
    );
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Permintaan tidak dapat diproses.',
  401: 'Sesi telah berakhir. Silakan masuk kembali.',
  403: 'Akses ditolak.',
  404: 'Data tidak ditemukan.',
  409: 'Data sudah berubah. Silakan muat ulang.',
  422: 'Data belum dapat diproses.',
  429: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.',
  500: 'Terjadi kesalahan pada server.',
  501: 'Fitur ini belum didukung.',
  502: 'Layanan sedang tidak tersedia. Coba lagi nanti.',
  503: 'Layanan sedang sibuk. Coba lagi.',
};

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers,
    signal,
    auth = true,
    notifyAuthError = true,
    timeoutMs = 25000,
  } = options;

  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort();

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', abortFromCaller);
  }

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const token = auth ? getAuthToken() : null;
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : null),
    ...(token ? { Authorization: `Bearer ${token}` } : null),
    ...headers,
  };

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      method,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut) {
      throw new ApiError('Koneksi terlalu lama. Periksa jaringan lalu coba lagi.', {
        status: 0,
        code: 'TIMEOUT',
      });
    }
    if (signal?.aborted) {
      throw new ApiError('Permintaan dibatalkan.', {
        status: 0,
        code: 'ABORTED',
      });
    }
    throw new ApiError(
      'Tidak dapat terhubung ke server. Periksa koneksi internet kamu.',
      { status: 0, code: 'NETWORK_ERROR', payload: error },
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abortFromCaller);
  }

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: text };
    }
  }

  if (!response.ok) {
    const errorBody = (payload ?? {}) as ApiErrorBody;
    const retryAfterHeader = Number(response.headers.get('retry-after'));
    const retryAfter =
      Number.isFinite(retryAfterHeader) && retryAfterHeader > 0
        ? retryAfterHeader
        : errorBody.retry_after;

    if (response.status === 401 && auth && notifyAuthError) {
      notifyUnauthorized();
    }
    if (
      response.status === 403 &&
      errorBody.code === 'APP_ONLY' &&
      auth &&
      notifyAuthError
    ) {
      notifyUnauthorized();
    }

    throw new ApiError(
      errorBody.error ||
        errorBody.message ||
        STATUS_MESSAGES[response.status] ||
        'Permintaan gagal.',
      {
        status: response.status,
        code: errorBody.code,
        retryAfter,
        requestId: errorBody.request_id,
        payload,
      },
    );
  }

  return payload as T;
}
