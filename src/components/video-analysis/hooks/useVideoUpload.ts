import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useVideoUpload = () => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string>('');

  const uploadVideo = async (recordedChunks: Blob[], mimeType: string) => {
    if (recordedChunks.length === 0) {
      toast({
        title: "Error",
        description: "No recording available to upload.",
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);
    try {
      const blob = new Blob(recordedChunks, { type: mimeType });
      const fileName = `videos/recording_${Date.now()}.webm`;

      const { error: uploadError } = await supabase
        .storage
        .from('videos')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: mimeType,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase
        .storage
        .from('videos')
        .getPublicUrl(fileName);

      if (!data.publicUrl) {
        throw new Error("Failed to retrieve video URL");
      }
      
      setPublicUrl(data.publicUrl);
      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    publicUrl,
    uploadVideo
  };
};