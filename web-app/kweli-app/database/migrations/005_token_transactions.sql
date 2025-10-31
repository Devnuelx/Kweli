-- Create token_transactions table to track all token movements
CREATE TABLE IF NOT EXISTS token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'qr_scan', 'ai_verification', 'transfer', 'reward'
  amount DECIMAL(10,2) NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  description TEXT,
  hedera_transaction_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX idx_token_transactions_created_at ON token_transactions(created_at DESC);

-- Add Hedera account fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS hedera_account_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS hedera_private_key TEXT;

-- Add index for Hedera account lookups
CREATE INDEX IF NOT EXISTS idx_users_hedera_account_id ON users(hedera_account_id);

