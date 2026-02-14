-- Create store_integrations table for managing external integrations
CREATE TABLE IF NOT EXISTS store_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google_sheets', 'facebook_pixel', 'tiktok_pixel', 'snapchat_pixel')),
    config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(store_id, provider)
);

-- Create index for faster lookups
CREATE INDEX idx_store_integrations_store_id ON store_integrations(store_id);
CREATE INDEX idx_store_integrations_active ON store_integrations(store_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE store_integrations ENABLE ROW LEVEL SECURITY;

-- Policy: Store members can view their store's integrations
CREATE POLICY "Store members can view integrations"
    ON store_integrations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM store_members
            WHERE store_members.store_id = store_integrations.store_id
            AND store_members.user_id = auth.uid()
        )
    );

-- Policy: Store owners can insert integrations
CREATE POLICY "Store owners can insert integrations"
    ON store_integrations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM store_members
            WHERE store_members.store_id = store_integrations.store_id
            AND store_members.user_id = auth.uid()
            AND store_members.role = 'owner'
        )
    );

-- Policy: Store owners can update integrations
CREATE POLICY "Store owners can update integrations"
    ON store_integrations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM store_members
            WHERE store_members.store_id = store_integrations.store_id
            AND store_members.user_id = auth.uid()
            AND store_members.role = 'owner'
        )
    );

-- Policy: Store owners can delete integrations
CREATE POLICY "Store owners can delete integrations"
    ON store_integrations
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM store_members
            WHERE store_members.store_id = store_integrations.store_id
            AND store_members.user_id = auth.uid()
            AND store_members.role = 'owner'
        )
    );

-- Policy: Public can view active pixel integrations for rendering on storefront
CREATE POLICY "Public can view active pixels"
    ON store_integrations
    FOR SELECT
    USING (
        is_active = true 
        AND provider IN ('facebook_pixel', 'tiktok_pixel', 'snapchat_pixel')
    );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_store_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER store_integrations_updated_at
    BEFORE UPDATE ON store_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_store_integrations_updated_at();
