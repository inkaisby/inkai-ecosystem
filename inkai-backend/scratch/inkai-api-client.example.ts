/**
 * Referensi client untuk inkai-sby / inkai-jatim / mobile.
 * Salin ke masing-masing frontend: lib/inkai-api.ts
 *
 * Env frontend:
 *   NEXT_PUBLIC_INKAI_API_URL=https://<inkai-backend>.vercel.app
 *
 * Auth: JWT dari POST /v1/auth/login → simpan di memory / httpOnly cookie (BFF).
 */

export type InkaiApiConfig = {
  baseUrl: string;
  getToken?: () => string | null | undefined;
};

export class InkaiApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'InkaiApiError';
    this.status = status;
    this.body = body;
  }
}

export function createInkaiApi(config: InkaiApiConfig) {
  const base = config.baseUrl.replace(/\/$/, '');

  async function request<T>(
    path: string,
    init: RequestInit = {},
    auth = true,
  ): Promise<T> {
    const headers = new Headers(init.headers);
    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json');
    }
    if (auth) {
      const token = config.getToken?.();
      if (token) headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(`${base}${path}`, { ...init, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg =
        (data as { message?: string }).message ??
        (data as { error?: string }).error ??
        `HTTP ${res.status}`;
      throw new InkaiApiError(msg, res.status, data);
    }
    return data as T;
  }

  return {
    // --- Auth ---
    register: (body: {
      email: string;
      password: string;
      fullName: string;
      phoneNumber?: string;
      dojoId: string;
    }) =>
      request<{ status: string; message: string }>('/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }, false),

    login: (body: { identifier: string; password: string }) =>
      request<{
        status: string;
        token: string;
        data: { user: Record<string, unknown> };
      }>('/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }, false),

    me: () =>
      request<{ status: string; data: Record<string, unknown> }>('/v1/auth/me'),

    forgotPassword: (email: string) =>
      request('/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }, false),

    resetPassword: (token: string, newPassword: string) =>
      request('/v1/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      }, false),

    // --- Org (public read) ---
    provinces: () => request('/v1/org/provinces', {}, false),
    branches: (provinceId: string) =>
      request(`/v1/org/branches/${provinceId}`, {}, false),
    dojos: (branchId: string) =>
      request(`/v1/org/dojos/${branchId}`, {}, false),

    // --- Members ---
    listMembers: (query?: Record<string, string>) => {
      const qs = query ? `?${new URLSearchParams(query)}` : '';
      return request(`/v1/members${qs}`);
    },

    approveMember: (memberId: string, nia?: string) =>
      request(`/v1/members/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Active',
          ...(nia ? { nia } : {}),
        }),
      }),

    rejectMember: (memberId: string) =>
      request(`/v1/members/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'REJECTED' }),
      }),

    updateMyProfile: (body: Record<string, unknown>) =>
      request('/v1/members/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    // --- Billing ---
    myBillings: () => request('/v1/billing/my'),
    payBilling: (body: {
      billingId: string;
      paymentMethod: string;
      proofUrl?: string;
    }) =>
      request('/v1/billing/pay', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    verifyBilling: (billingId: string, status: 'APPROVED' | 'REJECTED', adminNotes?: string) =>
      request('/v1/billing/verify', {
        method: 'POST',
        body: JSON.stringify({ billingId, status, adminNotes }),
      }),

    // --- Verifications (mutasi/prestasi) ---
    myVerifications: () => request('/v1/verifications/my'),
    pendingVerifications: () => request('/v1/verifications/pending'),
  };
}

/**
 * Contoh pemakaian di Next.js (client component):
 *
 * const api = createInkaiApi({
 *   baseUrl: process.env.NEXT_PUBLIC_INKAI_API_URL!,
 *   getToken: () => localStorage.getItem('inkai_token'),
 * });
 *
 * const { token, data } = await api.login({ identifier: email, password });
 * localStorage.setItem('inkai_token', token);
 */
