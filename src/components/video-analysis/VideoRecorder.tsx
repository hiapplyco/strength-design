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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      streamRef.current = stream;
      setIsWebcamOn(true);
      toast({
        title: "Camera Ready",
        description: "Your webcam is now active and ready to record.",
      });
    } catch (err: any) {
      console.error("Error accessing media devices:", err);
      toast({
        title: "Error",
        description: "Error accessing webcam. Please check your device settings.",
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
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;
      setRecordedChunks([]);

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };

      mediaRecorder.start();
      setRecording(true);
      toast({
        title: "Recording Started",
        description: "Your video is now being recorded.",
      });
    } catch (err: any) {
      console.error("Error starting recording:", err);
      toast({
        title: "Error",
        description: "Failed to start recording. Please try again.",
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
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const fileName = `videos/recording_${Date.now()}.webm`;

    const { error: uploadError } = await supabase
      .storage
      .from('videos')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'video/webm',
      });
    setUploading(false);
    
    if (uploadError) {
      console.error("Upload error:", uploadError.message);
      toast({
        title: "Upload Failed",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const { data } = supabase
      .storage
      .from('videos')
      .getPublicUrl(fileName);

    if (!data.publicUrl) {
      toast({
        title: "Error",
        description: "Failed to retrieve video URL.",
        variant: "destructive",
      });
    } else {
      setPublicUrl(data.publicUrl);
      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });
    }
    setRecordedChunks([]);
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