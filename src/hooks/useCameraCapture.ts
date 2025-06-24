
import { useRef, useState, useCallback } from 'react';
import { useWebcam } from '@/components/video-analysis/hooks/useWebcam';
import { useToast } from '@/hooks/use-toast';

export const useCameraCapture = () => {
  const { videoRef, isWebcamOn, startWebcam, stopWebcam } = useWebcam();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        title: "Error",
        description: "Camera not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      toast({
        title: "Error",
        description: "Failed to capture photo. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob then to File
    canvas.toBlob((blob) => {
      if (blob) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const file = new File([blob], `workout-photo-${timestamp}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        
        const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageUrl);
        setCapturedFile(file);
        
        toast({
          title: "Photo Captured",
          description: "Your workout photo has been captured successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to capture photo. Please try again.",
          variant: "destructive",
        });
      }
    }, 'image/jpeg', 0.8);
  }, [toast]);

  const clearCapture = useCallback(() => {
    setCapturedImage(null);
    setCapturedFile(null);
  }, []);

  return {
    videoRef,
    canvasRef,
    isWebcamOn,
    startWebcam,
    stopWebcam,
    capturePhoto,
    capturedImage,
    capturedFile,
    clearCapture
  };
};
