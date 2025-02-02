import React from 'react';
import { Button } from '@/components/ui/button';

interface VideoControlsProps {
  isWebcamOn: boolean;
  recording: boolean;
  recordedChunks: Blob[];
  uploading: boolean;
  publicUrl: string;
  onStartWebcam: () => void;
  onStopWebcam: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onUploadVideo: () => void;
  onAnalyzeVideo?: () => void;
  extraControls?: React.ReactNode;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  isWebcamOn,
  recording,
  recordedChunks,
  uploading,
  publicUrl,
  onStartWebcam,
  onStopWebcam,
  onStartRecording,
  onStopRecording,
  onUploadVideo,
  onAnalyzeVideo,
  extraControls,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isWebcamOn ? (
        <div className="flex items-center gap-2 w-full">
          <Button 
            onClick={onStartWebcam}
            className="bg-[#B08D57] hover:bg-[#B08D57]/80 text-white"
          >
            Start Webcam
          </Button>
          {extraControls}
        </div>
      ) : (
        <>
          {!recording ? (
            <Button 
              onClick={onStartRecording}
              className="bg-[#B08D57] hover:bg-[#B08D57]/80 text-white"
            >
              Start Recording
            </Button>
          ) : (
            <Button 
              onClick={onStopRecording}
              variant="destructive"
            >
              Stop Recording
            </Button>
          )}
          <Button 
            onClick={onStopWebcam}
            variant="destructiveSecondary"
          >
            Stop Webcam
          </Button>
          {extraControls}
        </>
      )}
      {!recording && recordedChunks.length > 0 && (
        <Button 
          onClick={onUploadVideo} 
          disabled={uploading}
          className="bg-[#B08D57] hover:bg-[#B08D57]/80 text-white"
        >
          {uploading ? "Uploading..." : "Upload Video"}
        </Button>
      )}
      {publicUrl && onAnalyzeVideo && (
        <Button
          onClick={onAnalyzeVideo}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Analyze Video
        </Button>
      )}
    </div>
  );
};