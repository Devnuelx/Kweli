/**
 * Authoritative Kweli API Client
 * Presentation-layer typed fetch client for communicating with the NestJS REST API.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role: 'CONSUMER' | 'BRAND_STAFF' | 'BRAND_ADMIN' | 'MODERATOR' | 'SYSTEM_ADMIN';
  isEmailVerified: boolean;
  pointAccount?: {
    balance: number;
    lifetimeEarned: number;
  };
  memberships?: Array<{
    id: string;
    role: string;
    organization: {
      id: string;
      legalName: string;
      tradingName?: string | null;
      kybStatus: string;
      brands?: Array<{ id: string; name: string; logoUrl?: string | null }>;
    };
  }>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  user: UserProfile;
}

export interface VerificationResult {
  isAuthentic: boolean;
  outcome: string;
  scanCount: number;
  firstScannedAt?: string;
  scratchPinVerified?: boolean | null;
  message: string;
  product?: {
    name: string;
    brand: string;
    sku?: string | null;
    category?: string | null;
    batchNumber: string;
    mfgDate?: string | null;
    expDate?: string | null;
    unitSerial: string;
  } | null;
}

export interface ReportSubmissionResponse {
  reportRef: string;
  accessSecret: string;
  status: string;
  productName: string;
  createdAt: string;
  message: string;
}

// In-memory token storage (persisted to localStorage for browser tabs)
let currentAccessToken: string | null = null;

if (typeof window !== 'undefined') {
  currentAccessToken = localStorage.getItem('kweli_access_token');
}

export const setAccessToken = (token: string | null) => {
  currentAccessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('kweli_access_token', token);
    } else {
      localStorage.removeItem('kweli_access_token');
    }
  }
};

export const getAccessToken = (): string | null => currentAccessToken;

/**
 * Core HTTP Request Wrapper with Auto-Refresh & Error Handling
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry: boolean = false,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (currentAccessToken) {
    headers.set('Authorization', `Bearer ${currentAccessToken}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Includes HttpOnly refresh cookie
  });

  // Handle Token Expiry & Automatic Refresh Rotation
  if (response.status === 401 && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setAccessToken(data.accessToken);
        // Retry original request with newly issued access token
        return request<T>(endpoint, options, true);
      } else {
        // Refresh session is dead; clear token
        setAccessToken(null);
      }
    } catch {
      setAccessToken(null);
    }
  }

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorJson = await response.json();
      errorMessage =
        Array.isArray(errorJson.message)
          ? errorJson.message.join(', ')
          : errorJson.message || errorJson.error || errorMessage;
    } catch {
      // Body not JSON
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Domain-specific Typed API Methods
 */
export const api = {
  auth: {
    async register(data: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    }) {
      return request<{ id: string; email: string; role: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async registerBrand(data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      companyName: string;
      registrationNum?: string;
      websiteUrl?: string;
      phone?: string;
    }) {
      return request<{ user: UserProfile; organization: any }>('/auth/register/brand', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async login(data: { email: string; password: string }) {
      const res = await request<AuthTokens>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (res.accessToken) {
        setAccessToken(res.accessToken);
      }
      return res;
    },

    async refresh() {
      const res = await request<AuthTokens>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      if (res.accessToken) {
        setAccessToken(res.accessToken);
      }
      return res;
    },

    async logout() {
      try {
        await request<{ success: boolean }>('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({}),
        });
      } finally {
        setAccessToken(null);
      }
    },

    async me() {
      return request<UserProfile>('/auth/me', {
        method: 'GET',
      });
    },
  },

  verification: {
    async scan(data: { code: string; scratchPin?: string }) {
      return request<VerificationResult>('/verification/scan', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async verifyAi(data: { imageBase64: string; location?: string }) {
      return request<{ visualAnalysis: any; disclaimer: string }>('/verification/ai', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  reports: {
    async submit(data: {
      productName: string;
      brandName?: string;
      description: string;
      purchaseLocation?: string;
      publicSerial?: string;
    }) {
      return request<ReportSubmissionResponse>('/reports', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async track(reportRef: string, accessSecret?: string) {
      const query = accessSecret ? `?secret=${encodeURIComponent(accessSecret)}` : '';
      return request<any>(`/reports/track/${reportRef}${query}`, {
        method: 'GET',
      });
    },

    async listForOrganization(page: number = 1, limit: number = 20) {
      return request<any>(`/reports/organization?page=${page}&limit=${limit}`, {
        method: 'GET',
      });
    },
  },

  products: {
    async register(data: {
      productId?: string;
      name: string;
      batchNumber: string;
      batchSize: number;
      sku?: string;
      category?: string;
      description?: string;
      manufacturingDate?: string;
      expiryDate?: string;
    }) {
      return request<any>('/products', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async list(page: number = 1, limit: number = 20) {
      return request<any>(`/products?page=${page}&limit=${limit}`, {
        method: 'GET',
      });
    },

    async stats() {
      return request<any>('/products/stats', {
        method: 'GET',
      });
    },

    async getBatch(batchId: string) {
      return request<any>(`/products/batches/${batchId}`, {
        method: 'GET',
      });
    },

    async downloadBatchExport(batchId: string, format: 'csv' | 'zip' = 'csv', batchNumber?: string) {
      const url = `${API_BASE_URL}/products/batches/${batchId}/export?format=${format}`;
      const headers = new Headers();
      if (currentAccessToken) {
        headers.set('Authorization', `Bearer ${currentAccessToken}`);
      }
      const res = await fetch(url, { headers, credentials: 'include' });
      if (!res.ok) {
        throw new Error(`Export failed with HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `batch-${batchNumber || batchId}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    },
  },

  apiKeys: {
    async list() {
      return request<
        Array<{
          id: string;
          name: string;
          keyPrefix: string;
          lastUsedAt?: string | null;
          createdAt: string;
        }>
      >('/api-keys', {
        method: 'GET',
      });
    },

    async create(name: string) {
      return request<{
        id: string;
        name: string;
        keyPrefix: string;
        apiKey: string;
        createdAt: string;
      }>('/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
    },

    async revoke(id: string) {
      return request<{ success: boolean; message: string }>(`/api-keys/${id}`, {
        method: 'DELETE',
      });
    },
  },
};
