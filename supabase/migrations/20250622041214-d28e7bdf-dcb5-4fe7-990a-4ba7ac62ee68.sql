
-- Add kategori column to alat table
ALTER TABLE public.alat 
ADD COLUMN kategori text DEFAULT 'alat' CHECK (kategori IN ('alat', 'bahan'));

-- Update existing records to have a default kategori
UPDATE public.alat 
SET kategori = 'alat' 
WHERE kategori IS NULL;
