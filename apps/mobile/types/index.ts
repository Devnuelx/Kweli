export interface Product {
  id?: string;
  name: string;
  brand?: string;
  info?: string;
  manufacturer?: string;
  batchNumber?: string;
  expiryDate?: string;
  manufactureDate?: string;
  manufacturingDate?: string;
  description?: string;
  companyName?: string;
  companyLogo?: string;
  companyLocation?: string;
  productId?: string;
  serialNumber?: string;
  category?: string;
  hederaExplorerUrl?: string;
}

export interface VerificationResult {
  verified: boolean;
  product?: Product;
  reward?: number;
  message?: string;
  confidence?: number;
  timestamp?: string;
  verificationType?: 'qr' | 'ai';
  alreadyScanned?: boolean; // Track if code was already scanned
  codeHash?: string; // Store the hash/ID of the scanned code
}

export interface Transaction {
  id: string;
  type: 'verification' | 'reward' | 'redemption';
  amount: number;
  description: string;
  date: string;
  productName?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  icon: string;
  reward: number;
  tier?: 'bronze' | 'silver' | 'gold';
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  points: number;
  totalScans: number;
  isLoggedIn: boolean;
  hederaAccountId?: string; // Hedera account ID (e.g., 0.0.12345)
}

export interface HistoryItem {
  id: string;
  product: Product;
  verified: boolean;
  points: number;
  date: string;
  verificationType: 'qr' | 'ai';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
}

