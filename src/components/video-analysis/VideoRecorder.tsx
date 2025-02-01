import React, { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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
      <h2 className="text-2xl font-bold mb-4 text-white">Record and Upload Video</h2>
      <video
        ref={videoRef}
        className="w-full aspect-video rounded-md bg-black/80 mb-4"
        autoPlay
        muted
      />
      <div className="flex gap-2 flex-wrap">
        {!isWebcamOn ? (
          <Button 
            onClick={startWebcam}
            className="bg-[#B08D57] hover:bg-[#B08D57]/80 text-white"
          >
            Start Webcam
          </Button>
        ) : (
          <>
            {!recording ? (
              <Button 
                onClick={startRecording}
                className="bg-[#B08D57] hover:bg-[#B08D57]/80 text-white"
              >
                Start Recording
              </Button>
            ) : (
              <Button 
                onClick={stopRecording}
                variant="destructive"
              >
                Stop Recording
              </Button>
            )}
            <Button 
              onClick={stopWebcam}
              variant="destructiveSecondary"
            >
              Stop Webcam
            </Button>
          </>
        )}
        {!recording && recordedChunks.length > 0 && (
          <Button 
            onClick={uploadVideo} 
            disabled={uploading}
            className="bg-[#B08D57] hover:bg-[#B08D57]/80 text-white"
          >
            {uploading ? "Uploading..." : "Upload Video"}
          </Button>
        )}
      </div>
      {publicUrl && (
        <div className="mt-4 p-4 bg-green-950/50 rounded-md">
          <p className="text-green-400 mb-2">Video uploaded successfully!</p>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            View Video
          </a>
        </div>
      )}
    </div>
  );
};

export default VideoRecorder;