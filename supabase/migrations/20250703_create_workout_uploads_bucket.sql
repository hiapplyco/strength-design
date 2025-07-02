-- Create storage bucket for workout uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workout-uploads',
  'workout-uploads',
  false,
  10485760, -- 10MB limit
  ARRAY[
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for workout uploads bucket
CREATE POLICY "Users can upload their own workout files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'workout-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own workout files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'workout-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own workout files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'workout-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);