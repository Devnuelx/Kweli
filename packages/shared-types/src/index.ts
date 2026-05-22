// Shared types for Kweli platform
// Used by both @kweli/web and @kweli/mobile

export interface Product {
  id?: string;
  name: string;
  sku?: string;
  category?: string;
  description?: string;
  company_id?: string;
  batch_size?: number;
  units_generated?: boolean;
  qr_hash?: string;
  hedera_topic_id?: string;
  scan_count?: number;
  status?: string;
  created_at?: string;
}

export interface ProductUnit {
  id: string;
  product_id: string;
  serial_code: string;
  qr_url: string;
  status: 'unscanned' | 'verified' | 'flagged';
  first_scanned_at?: string;
  scan_count: number;
  created_at: string;
}

export interface Campaign {
  id: string;
  company_id: string;
  name: string;
  type: 'instant_win' | 'collect_redeem';
  status: 'draft' | 'active' | 'paused' | 'ended';
  start_date?: string;
  end_date?: string;
  total_budget?: number;
  created_at: string;
}

export interface CampaignPrize {
  id: string;
  campaign_id: string;
  tier_name: string;
  prize_description?: string;
  prize_value?: number;
  win_probability?: number;
  max_winners?: number;
  current_winners: number;
  created_at: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_currency: string;
  max_units_per_month: number;
  max_active_campaigns: number;
  features: any;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  company_id: string;
  plan_id: string;
  status: 'trial' | 'active' | 'past_due' | 'cancelled';
  trial_ends_at?: string;
  current_period_start?: string;
  current_period_end?: string;
  payment_provider?: string;
  payment_ref?: string;
  created_at: string;
}

export interface ScanEvent {
  id: string;
  unit_id: string;
  scan_number: number;
  ip_address?: string;
  device_info?: any;
  geo_location?: any;
  hedera_tx_id?: string;
  created_at: string;
}

export interface CounterfeitReport {
  id: string;
  unit_id: string;
  reporter_phone?: string;
  reporter_email?: string;
  report_type: 'fake' | 'suspicious' | 'damaged';
  description?: string;
  image_urls?: string[];
  geo_location?: any;
  status: 'pending' | 'investigating' | 'resolved';
  created_at: string;
}

export interface VerificationResult {
  verified: boolean;
  product?: Product;
  reward?: number;
  message?: string;
  confidence?: number;
  timestamp?: string;
  verificationType?: 'qr' | 'ai';
  alreadyScanned?: boolean;
  codeHash?: string;
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
  hederaAccountId?: string;
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
