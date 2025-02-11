
import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Mic, Link2 } from 'lucide-react';
import { StyledHeaderButton } from '@/components/workout/header/StyledHeaderButton';
import { toast } from '@/components/ui/use-toast';

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
  const handleCopyLink = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      toast({
        title: "Success",
        description: "Link copied to clipboard!",
      });
    }
  };

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
      
      <div className="flex flex-wrap items-center gap-2">
        {onNarrate && (
          <StyledHeaderButton
            onClick={onNarrate}
            className="flex items-center gap-2"
          >
            <Mic className="w-4 h-4" />
            Narrate Script
          </StyledHeaderButton>
        )}
        {publicUrl && (
          <StyledHeaderButton
            onClick={handleCopyLink}
            className="flex items-center gap-2"
          >
            <Link2 className="w-4 h-4" />
            Copy Link
          </StyledHeaderButton>
        )}
      </div>
    </div>
  );
};
