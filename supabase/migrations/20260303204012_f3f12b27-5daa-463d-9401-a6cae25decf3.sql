
-- Create storage bucket for exercise images
INSERT INTO storage.buckets (id, name, public) VALUES ('exercise-media', 'exercise-media', true);

-- Allow public read access
CREATE POLICY "Exercise media are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'exercise-media');

-- Allow public uploads (single user app, no auth)
CREATE POLICY "Anyone can upload exercise media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'exercise-media');

-- Allow public updates
CREATE POLICY "Anyone can update exercise media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'exercise-media');

-- Allow public deletes
CREATE POLICY "Anyone can delete exercise media"
ON storage.objects FOR DELETE
USING (bucket_id = 'exercise-media');
