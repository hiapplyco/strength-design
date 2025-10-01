import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/hooks/firebase/useAuth';

export const useVideoUpload = () => {
  const { toast } = useToast();
  const { user } = useAuth();
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
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload videos.",
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

      const fileName = `videos/${user.uid}/recording_${Date.now()}.webm`;

      // Create a reference to the storage location
      const storageRef = ref(storage, fileName);

      // Upload the processed blob
      const snapshot = await uploadBytes(storageRef, processedBlob as Blob, {
        contentType: mimeType,
        customMetadata: {
          userId: user.uid,
          uploadedAt: new Date().toISOString()
        }
      });

      // Get the download URL
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      setPublicUrl(downloadUrl);
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