
-- Delete existing bucket if it exists and recreate properly
DELETE FROM storage.buckets WHERE id = 'item-images';

-- Create the storage bucket for item images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'item-images', 
  'item-images', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Remove existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view item images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload item images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update item images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete item images" ON storage.objects;

-- Create comprehensive storage policies
CREATE POLICY "Public can view item images"
ON storage.objects FOR SELECT
USING (bucket_id = 'item-images');

CREATE POLICY "Authenticated can upload item images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'item-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update item images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'item-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete item images"
ON storage.objects FOR DELETE
USING (bucket_id = 'item-images' AND auth.role() = 'authenticated');
