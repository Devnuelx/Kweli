import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { ApiResponse, User, VerificationResult } from '../types';

const API_BASE_URL = 'https://kweli-web.vercel.app';

// Auth token management
export const saveAuthToken = async (token: string) => {
  await AsyncStorage.setItem('auth_token', token);
};

export const getAuthToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('auth_token');
};

export const clearAuthToken = async () => {
  await AsyncStorage.removeItem('auth_token');
};

// Get auth headers
const getAuthHeaders = async () => {
  const token = await getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

// QR Code Verification
// The backend exposes GET /products/scan/:qr_hash — use GET and map the response.
export const verifyQRCode = async (hash: string): Promise<ApiResponse<VerificationResult>> => {
  try {
    const headers = await getAuthHeaders();
    const url = `${API_BASE_URL}/products/scan/${encodeURIComponent(hash)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
    }).catch((err) => {
      console.warn('verifyQRCode fetch failed:', err);
      throw err;
    });

    const data = await response.json();
    console.log('QR Verification Response:', JSON.stringify(data, null, 2));

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

    // Map server response to our VerificationResult
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
    console.error('QR verification error:', error);
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
  // Read image as base64 in a cross-platform way
  let base64Image: string | null = null;

  if (Platform.OS === 'web') {
    try {
      // For web, the imageUri may be a blob: or data: URL. Fetch and convert to base64.
      if (imageUri.startsWith('data:')) {
        // already a data URL
        base64Image = imageUri.split(',')[1];
      } else {
        const res = await fetch(imageUri);
        const blob = await res.blob();
        // convert blob to base64
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
    } catch (e) {
      console.warn('Web base64 conversion failed, falling back to file system:', e);
    }
  }

  if (!base64Image) {
    // Native fallback
    base64Image = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' as any });
  }

    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/verify-ai`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        image: `data:image/jpeg;base64,${base64Image}`,
      }),
    });

    const data = await response.json();
    
    // Log the response for debugging
    console.log('AI Verification Response:', JSON.stringify(data, null, 2));

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

    // Map the backend response to our VerificationResult format
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
    console.error('AI verification error:', error);
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
    // Request camera permissions
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      return {
        success: false,
        error: 'Camera permission is required to verify products.',
      };
    }
    // Launch camera. On web we omit cropping (allowsEditing) — just snap and verify.
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: Platform.OS !== 'web',
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled) {
      return { success: false, error: 'Photo capture cancelled.' };
    }

    // On web, some environments return a blob URI; returning as-is and letting verifyWithAI handle conversion
    return { success: true, uri: result.assets[0].uri };
  } catch (error) {
    console.error('Photo capture error:', error);
    return {
      success: false,
      error: 'Failed to capture photo. Please try again.',
    };
  }
};

// Sync user data with backend
export const syncUserData = async (
  points: number,
  history: any[],
  stats: any
): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ points, history, stats }),
    });

    return {
      success: response.ok,
      data: await response.json(),
    };
  } catch (error) {
    console.error('Sync error:', error);
    return {
      success: false,
      error: 'Failed to sync data with server.',
    };
  }
};

// Get user wallet info from backend
export const getUserWallet = async (userId: string): Promise<ApiResponse<User>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/wallet/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch wallet data');
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Wallet fetch error:', error);
    return {
      success: false,
      error: 'Failed to load wallet data.',
    };
  }
};

// Login
export const login = async (email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/consumer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Login failed',
      };
    }

    // Save token
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
          hederaAccountId: data.user.hederaAccountId || data.user.hedera_account_id, // Get Hedera ID from backend
        },
      },
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
};

// Signup
export const signup = async (name: string, email: string, password: string, phone?: string): Promise<ApiResponse<{ user: User }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/consumer/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Signup failed',
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
          hederaAccountId: data.user.hederaAccountId || data.user.hedera_account_id, // Get Hedera ID from backend
        },
      },
    };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
};

// Associate token with user account (required before receiving tokens)
// Note: This endpoint might need the user's Hedera account ID, not UUID
export const associateToken = async (hederaAccountId: string): Promise<ApiResponse<any>> => {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/associate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ accountId: hederaAccountId }),
    });

    const data = await response.json();
    
    console.log('Associate token request:', { accountId: hederaAccountId });
    console.log('Associate token response:', data);

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
    console.error('Association error:', error);
    return {
      success: false,
      error: 'Failed to associate token with account.',
    };
  }
};

// Transfer/Credit tokens to user
// receiverId must be a Hedera account ID (e.g., "0.0.12345")
export const creditTokens = async (hederaAccountId: string, amount: number): Promise<ApiResponse<any>> => {
  try {
    const headers = await getAuthHeaders();
    
    console.log('Credit tokens request:', { receiverId: hederaAccountId, amount });
    
    const response = await fetch(`${API_BASE_URL}/api/transfer`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ receiverId: hederaAccountId, amount }),
    });

    const data = await response.json();
    
    console.log('Credit tokens response:', data);

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
    console.error('Transfer error:', error);
    return {
      success: false,
      error: 'Failed to credit tokens.',
    };
  }
};

