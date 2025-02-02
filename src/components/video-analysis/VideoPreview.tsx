import React from 'react';

interface VideoPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({ videoRef }) => {
  return (
    <div className="relative w-full aspect-video bg-black/80 mb-4 rounded-md overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        playsInline
      />
    </div>
  );
};