// Stub implementation - original archived
// TODO: Restore from __archive__ if video features are needed

import { useRef } from 'react';

export const useRecording = (streamRef: React.RefObject<MediaStream | null>) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  return {
    recording: false,
    recordedChunks: [] as Blob[],
    startRecording: () => {
      console.warn('useRecording stub: startRecording not implemented');
    },
    stopRecording: () => {
      console.warn('useRecording stub: stopRecording not implemented');
    },
    mediaRecorderRef,
  };
};
