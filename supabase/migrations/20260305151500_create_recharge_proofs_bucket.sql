-- Create storage bucket for recharge proofs if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('recharge-proofs', 'recharge-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public access to read the proofs
CREATE POLICY "Public Access for Recharge Proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'recharge-proofs');

-- Allow authenticated users to upload proofs
CREATE POLICY "Authenticated users can upload recharge proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'recharge-proofs');

-- Allow users to manage their own proofs (optional but good for cleanup)
CREATE POLICY "Users can manage their own recharge proofs"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'recharge-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
