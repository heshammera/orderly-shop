-- Add is_featured column to tutorials table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tutorials' 
        AND column_name = 'is_featured'
    ) THEN
        ALTER TABLE public.tutorials ADD COLUMN is_featured BOOLEAN DEFAULT false;
    END IF;
END $$;
