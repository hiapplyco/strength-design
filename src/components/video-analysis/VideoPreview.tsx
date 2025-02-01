import React from 'react';

interface VideoPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ videoRef }) => {
  return (
    <video
      ref={videoRef}
      className="w-full aspect-video rounded-md bg-black/80 mb-4"
      autoPlay
      muted
    />
  );
};