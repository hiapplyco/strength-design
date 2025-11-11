import { useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useRecording = (streamRef: React.RefObject<MediaStream>) => {
  const { toast } = useToast();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  const startRecording = () => {
    if (!streamRef.current) return;
    
    try {
      const mimeTypes = [
        'video/mp4',
        'video/mp4;codecs=h264,aac',
        'video/webm',
        'video/webm;codecs=h264',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9,opus'
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          console.log('Supported MIME type found:', mimeType);
          selectedMimeType = mimeType;
          break;
        } else {
          console.log('Unsupported MIME type:', mimeType);
        }
      }
      
      if (!selectedMimeType) {
        throw new Error('No supported MIME type found for recording. Available types: ' + 
          mimeTypes.map(type => `${type} (${MediaRecorder.isTypeSupported(type)})`).join(', '));
      }

      const options = { 
        mimeType: selectedMimeType,
        videoBitsPerSecond: 2500000
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
        description: `${err.message} Please try using a different browser or device.`,
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

  return {
    recording,
    recordedChunks,
    startRecording,
    stopRecording,
    mediaRecorderRef
  };
};