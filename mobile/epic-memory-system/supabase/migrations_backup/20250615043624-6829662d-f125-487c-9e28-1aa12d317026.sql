
-- Create a new storage bucket for chat uploads with a 5MB file size limit and specific allowed file types.
insert into storage.buckets
  (id, name, public, file_size_limit, allowed_mime_types)
values
  ('chat_uploads', 'chat_uploads', true, 5242880, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

-- Create an RLS policy to allow authenticated users to upload files to the new bucket.
CREATE POLICY "Allow authenticated uploads on chat_uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat_uploads');

-- Create an RLS policy to allow public read access for viewing uploaded files.
CREATE POLICY "Allow public read access on chat_uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat_uploads');
