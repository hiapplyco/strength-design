
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
      // Create a web worker for processing
      const worker = new Worker(
        new URL('../workers/video-processor.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Create a promise to handle the worker response
      const processedBlob = await new Promise((resolve, reject) => {
        worker.onmessage = (e) => {
          if (e.data.error) {
            reject(new Error(e.data.error));
          } else {
            resolve(e.data.processedBlob);
          }
        };

        worker.onerror = (error) => {
          reject(new Error('Worker error: ' + error.message));
        };

        // Send data to worker
        worker.postMessage({
          chunks: recordedChunks,
          mimeType,
          options: {
            compress: true,
            targetBitrate: 1500000
          }
        });
      });

      // Terminate the worker after processing
      worker.terminate();

      const fileName = `videos/recording_${Date.now()}.webm`;

      // Upload the processed blob
      const { error: uploadError } = await supabase
        .storage
        .from('videos')
        .upload(fileName, processedBlob as Blob, {
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
