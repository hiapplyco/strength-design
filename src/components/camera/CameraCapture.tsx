
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, RotateCcw, Check } from 'lucide-react';
import { useCameraCapture } from '@/hooks/useCameraCapture';

interface CameraCaptureProps {
  onPhotoCapture: (file: File) => Promise<void>;
  title?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  onPhotoCapture,
  title = "Capture Workout Photo"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const {
    videoRef,
    canvasRef,
    isWebcamOn,
    startWebcam,
    stopWebcam,
    capturePhoto,
    capturedImage,
    capturedFile,
    clearCapture
  } = useCameraCapture();

  const handleOpenCamera = async () => {
    setIsOpen(true);
    if (!isWebcamOn) {
      await startWebcam();
    }
  };

  const handleCloseCamera = () => {
    setIsOpen(false);
    stopWebcam();
    clearCapture();
  };

  const handleConfirmPhoto = async () => {
    if (!capturedFile) return;
    
    setIsProcessing(true);
    try {
      await onPhotoCapture(capturedFile);
      handleCloseCamera();
    } catch (error) {
      console.error('Error processing photo:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetakePhoto = () => {
    clearCapture();
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={handleOpenCamera}
        className="transition-colors"
        title="Take photo with camera"
      >
        <Camera className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              {title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!capturedImage ? (
              // Camera preview mode
              <div className="space-y-4">
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
                        <p>Starting camera...</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-center gap-3">
                  <Button
                    onClick={capturePhoto}
                    disabled={!isWebcamOn}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Capture Photo
                  </Button>
                  <Button variant="outline" onClick={handleCloseCamera}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // Photo preview mode
              <div className="space-y-4">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <img
                    src={capturedImage}
                    alt="Captured workout photo"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex justify-center gap-3">
                  <Button
                    onClick={handleConfirmPhoto}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {isProcessing ? 'Processing...' : 'Use This Photo'}
                  </Button>
                  <Button variant="outline" onClick={handleRetakePhoto}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Retake
                  </Button>
                  <Button variant="outline" onClick={handleCloseCamera}>
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />
        </DialogContent>
      </Dialog>
    </>
  );
};
