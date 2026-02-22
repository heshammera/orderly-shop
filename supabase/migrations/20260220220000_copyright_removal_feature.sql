-- 1. Add has_removed_copyright boolean to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS has_removed_copyright BOOLEAN DEFAULT FALSE;

-- 2. Add remove_copyright_price to system settings if not exists
INSERT INTO system_settings (key, value, description)
VALUES (
    'remove_copyright_price',
    '50.00',
    'Price to remove the "Powered by Orderly" copyright from the store footer'
) ON CONFLICT (key) DO NOTHING;

-- 3. Create table for copyright_removal_requests
CREATE TABLE IF NOT EXISTS copyright_removal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'SAR',
    receipt_url TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for copyright_removal_requests
ALTER TABLE copyright_removal_requests ENABLE ROW LEVEL SECURITY;

-- Policies for Stores
CREATE POLICY "Stores can view their own copyright requests"
    ON copyright_removal_requests FOR SELECT
    USING (store_id IN (SELECT store_id FROM store_members WHERE user_id = auth.uid()));

CREATE POLICY "Stores can insert their own copyright requests"
    ON copyright_removal_requests FOR INSERT
    WITH CHECK (store_id IN (SELECT store_id FROM store_members WHERE user_id = auth.uid()));

-- Policies for Super Admins
CREATE POLICY "Super Admins can view all copyright requests"
    ON copyright_removal_requests FOR SELECT
    USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'));

CREATE POLICY "Super Admins can update all copyright requests"
    ON copyright_removal_requests FOR UPDATE
    USING (EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'));

-- Trigger to update stores 'has_removed_copyright' when a request is approved
CREATE OR REPLACE FUNCTION handle_copyright_request_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        UPDATE stores SET has_removed_copyright = TRUE WHERE id = NEW.store_id;
    ELSIF NEW.status != 'approved' AND OLD.status = 'approved' THEN
        -- Optional: Revert if changing from approved to something else
        UPDATE stores SET has_removed_copyright = FALSE WHERE id = NEW.store_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_copyright_request_approved
    AFTER UPDATE ON copyright_removal_requests
    FOR EACH ROW
    EXECUTE FUNCTION handle_copyright_request_approval();
