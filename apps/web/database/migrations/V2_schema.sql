-- Product units (individual serialized items within a product/batch)
CREATE TABLE IF NOT EXISTS product_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  serial_code UUID DEFAULT gen_random_uuid(),  -- unique per unit
  qr_url TEXT,          -- kweli-web.vercel.app/v/{serial_code}
  status TEXT DEFAULT 'unscanned',  -- unscanned | verified | flagged
  first_scanned_at TIMESTAMPTZ,
  scan_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pricing plans
CREATE TABLE IF NOT EXISTS pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price_monthly NUMERIC,
  price_currency TEXT DEFAULT 'NGN',
  max_units_per_month INT,
  max_active_campaigns INT,
  features JSONB,
  is_active BOOLEAN DEFAULT true
);

-- Company subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  plan_id UUID REFERENCES pricing_plans(id),
  status TEXT DEFAULT 'trial',  -- trial | active | past_due | cancelled
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  payment_provider TEXT,       -- paystack | flutterwave
  payment_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'instant_win',  -- instant_win | collect_redeem
  status TEXT DEFAULT 'draft',      -- draft | active | paused | ended
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  total_budget NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Campaign-product link (which products trigger which campaign)
CREATE TABLE IF NOT EXISTS campaign_products (
  campaign_id UUID REFERENCES campaigns(id),
  product_id UUID REFERENCES products(id),
  PRIMARY KEY (campaign_id, product_id)
);

-- Prize tiers
CREATE TABLE IF NOT EXISTS campaign_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  tier_name TEXT NOT NULL,        -- e.g. "Grand Prize", "Runner Up"
  prize_description TEXT,
  prize_value NUMERIC,
  win_probability NUMERIC,       -- e.g. 0.05 for 5%
  max_winners INT,
  current_winners INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Campaign entries (consumer scans that entered a campaign)
CREATE TABLE IF NOT EXISTS campaign_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  unit_id UUID REFERENCES product_units(id),
  consumer_phone TEXT,
  consumer_email TEXT,
  prize_id UUID REFERENCES campaign_prizes(id),  -- NULL if no win
  won BOOLEAN DEFAULT false,
  prize_claimed BOOLEAN DEFAULT false,
  ip_address TEXT,
  device_info JSONB,
  geo_location JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, unit_id)  -- 1 entry per serial per campaign
);

-- Scan events (replaces simple verifications table)
CREATE TABLE IF NOT EXISTS scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES product_units(id),
  scan_number INT,           -- 1st, 2nd, 3rd...
  ip_address TEXT,
  device_info JSONB,
  geo_location JSONB,
  hedera_tx_id TEXT,         -- Hedera consensus proof
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Counterfeit reports (enhanced)
CREATE TABLE IF NOT EXISTS counterfeit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES product_units(id),
  reporter_phone TEXT,
  reporter_email TEXT,
  report_type TEXT,          -- fake | suspicious | damaged
  description TEXT,
  image_urls TEXT[],
  geo_location JSONB,
  status TEXT DEFAULT 'pending',  -- pending | investigating | resolved
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Alter existing tables
ALTER TABLE companies ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE products ADD COLUMN IF NOT EXISTS batch_size INT DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS units_generated BOOLEAN DEFAULT false;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_units_serial ON product_units(serial_code);
CREATE INDEX IF NOT EXISTS idx_product_units_product ON product_units(product_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_unit ON scan_events(unit_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_ip ON scan_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_campaign_entries_campaign ON campaign_entries(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_entries_phone ON campaign_entries(consumer_phone);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON subscriptions(company_id);
