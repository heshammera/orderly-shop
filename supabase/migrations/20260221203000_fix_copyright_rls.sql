-- Drop the old policies
DROP POLICY IF EXISTS "Stores can view their own copyright requests" ON copyright_removal_requests;
DROP POLICY IF EXISTS "Stores can insert their own copyright requests" ON copyright_removal_requests;

-- Create updated policies that also check stores.owner_id
CREATE POLICY "Stores can view their own copyright requests"
    ON copyright_removal_requests FOR SELECT
    USING (
        store_id IN (SELECT store_id FROM store_members WHERE user_id = auth.uid())
        OR 
        store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
    );

CREATE POLICY "Stores can insert their own copyright requests"
    ON copyright_removal_requests FOR INSERT
    WITH CHECK (
        store_id IN (SELECT store_id FROM store_members WHERE user_id = auth.uid())
        OR 
        store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid())
    );
