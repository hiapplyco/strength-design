import { useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useWebcam = () => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isWebcamOn, setIsWebcamOn] = useState(false);

  const startWebcam = async () => {
    try {
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 1280, max: 1280 },
          height: { ideal: 720, max: 720 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play().catch(err => {
          console.error("Error playing video:", err);
          throw new Error("Failed to play video stream");
        });
      }
      
      streamRef.current = stream;
      setIsWebcamOn(true);
      toast({
        title: "Camera Ready",
        description: "Your webcam is now active and ready to record.",
      });
    } catch (err: any) {
      console.error("Error accessing media devices:", err);
      let errorMessage = "Error accessing webcam. ";
      
      if (err.name === 'NotAllowedError') {
        errorMessage += "Please grant camera and microphone permissions.";
      } else if (err.name === 'NotFoundError') {
        errorMessage += "No camera or microphone found.";
      } else if (err.name === 'NotReadableError') {
        errorMessage += "Camera or microphone is already in use.";
      } else {
        errorMessage += "Please check your device settings.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsWebcamOn(false);
  };

  return {
    videoRef,
    streamRef,
    isWebcamOn,
    startWebcam,
    stopWebcam
  };
};