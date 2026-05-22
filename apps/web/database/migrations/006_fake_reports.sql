-- Create fake_reports table for users to report counterfeit products
CREATE TABLE IF NOT EXISTS fake_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  brand_name VARCHAR(255),
  description TEXT NOT NULL,
  location VARCHAR(255),
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'confirmed', 'dismissed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_fake_reports_user_id ON fake_reports(user_id);
CREATE INDEX idx_fake_reports_status ON fake_reports(status);
CREATE INDEX idx_fake_reports_created_at ON fake_reports(created_at DESC);
