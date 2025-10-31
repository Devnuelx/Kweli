-- Create design_templates table for storing QR placement templates
CREATE TABLE IF NOT EXISTS design_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  template_url TEXT,
  qr_placement JSONB NOT NULL,
  placeholder_color VARCHAR(7),
  placeholder_text VARCHAR(100),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on company_id for faster lookups
CREATE INDEX idx_design_templates_company_id ON design_templates(company_id);

-- Add design_output_url column to products table to store generated designs
ALTER TABLE products ADD COLUMN IF NOT EXISTS design_output_url TEXT;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_design_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_design_templates_updated_at
BEFORE UPDATE ON design_templates
FOR EACH ROW
EXECUTE FUNCTION update_design_templates_updated_at();

-- Create storage bucket for product designs (run this in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('product-designs', 'product-designs', true);

-- Set up RLS policies for design_templates
ALTER TABLE design_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view their own templates"
  ON design_templates
  FOR SELECT
  USING (auth.uid() = company_id);

CREATE POLICY "Companies can create their own templates"
  ON design_templates
  FOR INSERT
  WITH CHECK (auth.uid() = company_id);

CREATE POLICY "Companies can update their own templates"
  ON design_templates
  FOR UPDATE
  USING (auth.uid() = company_id);

CREATE POLICY "Companies can delete their own templates"
  ON design_templates
  FOR DELETE
  USING (auth.uid() = company_id);

