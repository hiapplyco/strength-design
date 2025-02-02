import React, { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VideoPreview } from './VideoPreview';
import { VideoControls } from './VideoControls';
import { UploadStatus } from './UploadStatus';

const VideoRecorder: React.FC = () => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isWebcamOn, setIsWebcamOn] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [uploading, setUploading] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string>('');

  const startWebcam = async () => {
    try {
      // iOS Safari specific constraints
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

  const startRecording = () => {
    if (!streamRef.current) return;
    
    try {
      const mimeTypes = [
        'video/mp4;codecs=h264,aac',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }
      
      if (!selectedMimeType) {
        throw new Error('No supported MIME type found for recording');
      }

      const options = { 
        mimeType: selectedMimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      };
      
      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;
      setRecordedChunks([]);

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      mediaRecorder.start(1000);
      setRecording(true);
      toast({
        title: "Recording Started",
        description: "Your video is now being recorded.",
      });
    } catch (err: any) {
      console.error("Error starting recording:", err);
      toast({
        title: "Recording Error",
        description: err.message || "Failed to start recording. Your browser might not support video recording.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      toast({
        title: "Recording Stopped",
        description: "Your video has been recorded successfully.",
      });
    }
  };

  const uploadVideo = async () => {
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
      // Create a Blob with the correct MIME type
      const blob = new Blob(recordedChunks, { 
        type: mediaRecorderRef.current?.mimeType || 'video/webm' 
      });
      const fileName = `videos/recording_${Date.now()}.webm`;

      const { error: uploadError } = await supabase
        .storage
        .from('videos')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: mediaRecorderRef.current?.mimeType || 'video/webm',
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
      setRecordedChunks([]);
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

  return (
    <div className="w-full max-w-xl mx-auto bg-black/50 backdrop-blur-sm p-6 rounded-lg border border-gray-800">
      <VideoPreview videoRef={videoRef} />
      <VideoControls
        isWebcamOn={isWebcamOn}
        recording={recording}
        recordedChunks={recordedChunks}
        uploading={uploading}
        publicUrl={publicUrl}
        onStartWebcam={startWebcam}
        onStopWebcam={stopWebcam}
        onStartRecording={startRecording}
        onStopRecording={stopRecording}
        onUploadVideo={uploadVideo}
      />
      <UploadStatus publicUrl={publicUrl} />
    </div>
  );
};

export default VideoRecorder;
