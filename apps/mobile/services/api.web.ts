import { ApiResponse, User, VerificationResult } from '../types';
// Explicitly import the web storage implementation
import { getAuthToken, saveAuthToken } from './storage.web';

// CORS Proxy for development/demo - bypasses CORS restrictions
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

// Use CORS proxy in production to bypass CORS issues
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3000'
  : 'https://kweli-web.vercel.app';

// Helper to add CORS proxy in production
const getApiUrl = (endpoint: string) => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? `${CORS_PROXY}${API_BASE_URL}` 
    : API_BASE_URL;
  return `${baseUrl}${endpoint}`;
};

// Get auth headers with CORS support for web
const getAuthHeaders = async () => {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Platform': 'web',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// QR Code Verification
export const verifyQRCode = async (hash: string): Promise<ApiResponse<VerificationResult>> => {
  try {
    const headers = await getAuthHeaders();
    const url = getApiUrl(`/products/scan/${encodeURIComponent(hash)}`);

    console.log('🔍 Verifying QR Code:', hash);
    console.log('📡 Request URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    }).catch((err) => {
      console.error('❌ Fetch failed:', err);
      throw err;
    });

    const data = await response.json();
    console.log('✅ QR Verification Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      return {
        success: false,
        data: {
          verified: false,
          message: data.error || data.message || 'Verification failed',
          timestamp: new Date().toISOString(),
          verificationType: 'qr' as const,
        },
      };
    }

    // Map server response to VerificationResult
    return {
      success: true,
      data: {
        verified: data.authenticity?.verified ?? true,
        message: data.message || (data.authenticity?.verified ? 'Product verified successfully' : 'Product could not be verified'),
        product: data.product,
        reward: data.reward?.amount ?? data.reward ?? 0,
        timestamp: new Date().toISOString(),
        verificationType: 'qr' as const,
      },
    };
  } catch (error) {
    console.error('❌ QR verification error:', error);
    return {
      success: false,
      data: {
        verified: false,
        message: 'Network error. Please check your connection and try again.',
        timestamp: new Date().toISOString(),
        verificationType: 'qr' as const,
      },
    };
  }
};

// AI Photo Verification
export const verifyWithAI = async (imageUri: string): Promise<ApiResponse<VerificationResult>> => {
  try {
    // For web, convert imageUri to base64
    let base64Image: string;
    if (imageUri.startsWith('data:')) {
      base64Image = imageUri.split(',')[1];
    } else {
      const res = await fetch(imageUri);
      const blob = await res.blob();
      base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    const headers = await getAuthHeaders();
    const url = getApiUrl('/api/verify-ai');

    console.log('🤖 AI Verification Request');
    console.log('📡 Request URL:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        image: `data:image/jpeg;base64,${base64Image}`,
      }),
    }).catch((err) => {
      console.error('❌ AI verification fetch failed:', err);
      throw err;
    });

    const data = await response.json();
    console.log('✅ AI Verification Response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      return {
        success: false,
        data: {
          verified: false,
          message: data.error || data.message || 'AI verification failed',
          confidence: 0,
          timestamp: new Date().toISOString(),
          verificationType: 'ai' as const,
        },
      };
    }

    return {
      success: true,
      data: {
        verified: data.verified ?? false,
        message: data.message || (data.verified ? 'Product verified successfully' : 'Product could not be verified'),
        product: data.product ? {
          name: data.product.productName || data.product.brandName || 'Unknown Product',
          brand: data.product.brandName,
          category: data.product.category,
          description: data.analysis,
          info: data.analysis,
          companyName: data.product.brandName,
          productId: undefined,
          serialNumber: undefined,
        } : undefined,
        reward: data.reward?.amount || 0,
        confidence: data.confidence || 0,
        timestamp: new Date().toISOString(),
        verificationType: 'ai' as const,
      },
    };
  } catch (error) {
    console.error('❌ AI verification error:', error);
    return {
      success: false,
      data: {
        verified: false,
        message: 'AI verification failed. Please try again.',
        confidence: 0,
        timestamp: new Date().toISOString(),
        verificationType: 'ai' as const,
      },
    };
  }
};

// Take Photo for AI Verification
export const takeProductPhoto = async (): Promise<{ success: boolean; uri?: string; error?: string }> => {
  try {
    const result = await new Promise<{ uri: string }>((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => resolve({ uri: reader.result as string });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        } else {
          reject(new Error('No file selected'));
        }
      };
      
      input.click();
    });

    return { success: true, uri: result.uri };
  } catch (error) {
    console.error('❌ Photo capture error:', error);
    return {
      success: false,
      error: 'Failed to capture photo. Please try again.',
    };
  }
};

// Login
export const login = async (email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> => {
  try {
    const headers = await getAuthHeaders();
    const url = getApiUrl('/api/auth/consumer/login');

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, password }),
    }).catch((err) => {
      console.error('❌ Login fetch failed:', err);
      throw err;
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Login failed',
      };
    }

    if (data.token) {
      await saveAuthToken(data.token);
    }

    return {
      success: true,
      data: {
        token: data.token,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          points: data.user.totalRewards || 0,
          totalScans: data.user.totalScans || 0,
          isLoggedIn: true,
          hederaAccountId: data.user.hederaAccountId || data.user.hedera_account_id,
        },
      },
    };
  } catch (error) {
    console.error('❌ Login error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
};

// Signup
export const signup = async (name: string, email: string, password: string, phone?: string): Promise<ApiResponse<{ user: User }>> => {
  try {
    const headers = await getAuthHeaders();
    const url = getApiUrl('/api/auth/consumer/signup');

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, email, password, phone }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Signup failed',
        status: response.status,
      };
    }

    return {
      success: true,
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          points: data.user.totalRewards || 0,
          totalScans: data.user.totalScans || 0,
          isLoggedIn: true,
          hederaAccountId: data.user.hederaAccountId || data.user.hedera_account_id,
        },
      },
    };
  } catch (error) {
    console.error('❌ Signup error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
};

// Get user wallet info
export const getUserWallet = async (userId: string): Promise<ApiResponse<User>> => {
  try {
    const headers = await getAuthHeaders();
    const url = getApiUrl(`/api/user/wallet/${userId}`);

    const response = await fetch(url, {
      headers,
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch wallet data');
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('❌ Wallet fetch error:', error);
    return {
      success: false,
      error: 'Failed to load wallet data.',
    };
  }
};

// Associate token with user account
export const associateToken = async (hederaAccountId: string): Promise<ApiResponse<any>> => {
  try {
    const headers = await getAuthHeaders();
    const url = getApiUrl('/api/associate');

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ accountId: hederaAccountId }),
    });

    const data = await response.json();
    console.log('✅ Associate token response:', data);

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Token association failed',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('❌ Association error:', error);
    return {
      success: false,
      error: 'Failed to associate token with account.',
    };
  }
};

// Transfer/Credit tokens to user
export const creditTokens = async (hederaAccountId: string, amount: number): Promise<ApiResponse<any>> => {
  try {
    const headers = await getAuthHeaders();
    const url = getApiUrl('/api/transfer');

    console.log('💰 Credit tokens request:', { receiverId: hederaAccountId, amount });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ receiverId: hederaAccountId, amount }),
    });

    const data = await response.json();
    console.log('✅ Credit tokens response:', data);

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Token transfer failed',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('❌ Transfer error:', error);
    return {
      success: false,
      error: 'Failed to credit tokens.',
    };
  }
};