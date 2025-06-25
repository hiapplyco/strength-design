
import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Video, StopCircle, RotateCcw, Check, X } from 'lucide-react';
import { useWebcam } from '@/components/video-analysis/hooks/useWebcam';
import { useRecording } from '@/components/video-analysis/hooks/useRecording';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MovementCameraRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoRecorded: (file: File) => void;
}

export const MovementCameraRecorder = ({ isOpen, onClose, onVideoRecorded }: MovementCameraRecorderProps) => {
  const { videoRef, streamRef, isWebcamOn, startWebcam, stopWebcam } = useWebcam();
  const { recording, recordedChunks, startRecording, stopRecording, mediaRecorderRef } = useRecording(streamRef);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Recording timer
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [recording]);

  // Handle recording chunks
  React.useEffect(() => {
    if (recordedChunks.length > 0 && !recording) {
      setHasRecording(true);
    }
  }, [recordedChunks, recording]);

  const handleStartCamera = async () => {
    try {
      await startWebcam();
      toast.success("Camera ready for movement analysis recording");
    } catch (error) {
      toast.error("Failed to start camera. Please check permissions.");
    }
  };

  const handleStartRecording = () => {
    startRecording();
    setHasRecording(false);
    toast.success("Recording started - capture your movement technique");
  };

  const handleStopRecording = () => {
    stopRecording();
    toast.success("Recording completed");
  };

  const handleRetake = () => {
    setHasRecording(false);
    setRecordingTime(0);
  };

  const handleSaveRecording = useCallback(async () => {
    if (recordedChunks.length === 0) {
      toast.error("No recording available");
      return;
    }

    setIsProcessing(true);
    try {
      // Create video file from recorded chunks
      const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
      const blob = new Blob(recordedChunks, { type: mimeType });
      
      // Create a File object with a proper name
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const fileName = `movement-analysis-${timestamp}.${extension}`;
      
      const file = new File([blob], fileName, { type: mimeType });
      
      onVideoRecorded(file);
      onClose();
      stopWebcam();
      
      toast.success("Movement video ready for analysis!");
    } catch (error) {
      console.error('Error processing recording:', error);
      toast.error("Failed to process recording. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [recordedChunks, mediaRecorderRef, onVideoRecorded, onClose, stopWebcam]);

  const handleClose = () => {
    stopWebcam();
    setHasRecording(false);
    setRecordingTime(0);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Record Movement Analysis Video
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Preview */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
            
            {!isWebcamOn && (
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <div className="text-center">
                  <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Camera not started</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Click "Start Camera" to begin
                  </p>
                </div>
              </div>
            )}

            {/* Recording Indicator */}
            {recording && (
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <Badge variant="destructive" className="font-mono">
                  REC {formatTime(recordingTime)}
                </Badge>
              </div>
            )}

            {/* Recording Controls Overlay */}
            {isWebcamOn && !hasRecording && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                {!recording ? (
                  <Button
                    onClick={handleStartRecording}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full"
                  >
                    <Video className="mr-2 h-5 w-5" />
                    Start Recording
                  </Button>
                ) : (
                  <Button
                    onClick={handleStopRecording}
                    variant="secondary"
                    className="px-6 py-3 rounded-full"
                  >
                    <StopCircle className="mr-2 h-5 w-5" />
                    Stop Recording
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Recording Tips */}
          {isWebcamOn && !recording && !hasRecording && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Recording Tips:</strong> Position yourself so your full movement is visible. 
                Keep recordings under 60 seconds for optimal analysis. Ensure good lighting for best results.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {!isWebcamOn ? (
                <Button onClick={handleStartCamera} className="bg-primary hover:bg-primary/90">
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera
                </Button>
              ) : (
                <>
                  {hasRecording && (
                    <>
                      <Button
                        onClick={handleRetake}
                        variant="outline"
                        disabled={isProcessing}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Retake
                      </Button>
                      <Button
                        onClick={handleSaveRecording}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isProcessing}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        {isProcessing ? 'Processing...' : 'Use This Recording'}
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
            
            <Button variant="outline" onClick={handleClose}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>

          {/* Recording Info */}
          {hasRecording && (
            <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Recording ready • Duration: {formatTime(recordingTime)} • 
              Size: {recordedChunks.length > 0 ? `${(recordedChunks.reduce((acc, chunk) => acc + chunk.size, 0) / 1024 / 1024).toFixed(1)}MB` : 'Unknown'}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
