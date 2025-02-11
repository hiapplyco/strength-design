
import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Mic } from 'lucide-react';

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
  onNarrate?: () => void;
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
  onNarrate,
  extraControls,
}) => {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex flex-wrap items-center gap-2">
        {!isWebcamOn ? (
          <div className="flex items-center gap-2">
            <Button 
              onClick={onStartWebcam}
              className="bg-[#B08D57] hover:bg-[#B08D57]/80 text-white flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
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
      </div>
      {onNarrate && (
        <Button
          onClick={onNarrate}
          variant="outline"
          className="flex items-center gap-2 w-fit"
        >
          <Mic className="w-4 h-4" />
          Narrate Script
        </Button>
      )}
    </div>
  );
};
