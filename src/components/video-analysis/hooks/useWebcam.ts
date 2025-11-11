// Stub implementation - original archived
// TODO: Restore from __archive__ if video features are needed

import { useRef } from 'react';

export const useWebcam = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  return {
    videoRef,
    streamRef,
    isWebcamOn: false,
    startWebcam: async () => {
      console.warn('useWebcam stub: startWebcam not implemented');
    },
    stopWebcam: () => {
      console.warn('useWebcam stub: stopWebcam not implemented');
    },
  };
};
