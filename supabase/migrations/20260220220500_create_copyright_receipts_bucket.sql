-- 1. Create a public storage bucket for copyright removal receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('copyright-receipts', 'copyright-receipts', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow authenticated users (vendors) to upload receipts
CREATE POLICY "Allow vendors to upload copyright receipts"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'copyright-receipts' );

-- 3. Allow vendors to view their own receipts, and super admins to view all (using existing roles or public access since it's a public bucket, we can just allow SELECT for public)
CREATE POLICY "Allow public to view copyright receipts"
ON storage.objects FOR SELECT TO public
USING ( bucket_id = 'copyright-receipts' );

-- 4. Allow users to update/delete their own uploads (optional, but good practice)
CREATE POLICY "Allow vendors to manage their own copyright receipts"
ON storage.objects FOR ALL TO authenticated
USING ( bucket_id = 'copyright-receipts' AND auth.uid() = owner )
WITH CHECK ( bucket_id = 'copyright-receipts' AND auth.uid() = owner );
