
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Upload, Video, Camera } from 'lucide-react';
import { VideoPreview } from './VideoPreview';
import { MovementCameraRecorder } from './MovementCameraRecorder';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EnhancedVideoInputProps {
  uploadedVideo: File | null;
  setUploadedVideo: (file: File | null) => void;
  setAnalysis: (analysis: string | null) => void;
}

export const EnhancedVideoInput = ({ 
  uploadedVideo, 
  setUploadedVideo, 
  setAnalysis 
}: EnhancedVideoInputProps) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [isDragOver, setIsDragOver] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  const validateVideoFile = (file: File): boolean => {
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload an MP4, MOV, AVI, or WebM video file");
      return false;
    }
    
    const MAX_SIZE = 20 * 1024 * 1024; // 20MB
    if (file.size > MAX_SIZE) {
      toast.error("Video file size must be less than 20MB");
      return false;
    }
    
    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateVideoFile(file)) {
      setUploadedVideo(file);
      setAnalysis(null);
      toast.success(`Video "${file.name}" selected for analysis`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleCameraRecording = (file: File) => {
    setUploadedVideo(file);
    setAnalysis(null);
    setCameraOpen(false);
  };

  const clearVideo = () => {
    setUploadedVideo(null);
    setAnalysis(null);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white mb-2">1. Upload or Record Your Technique Video</h3>
      
      {uploadedVideo ? (
        // Video Preview Mode
        <div className="space-y-4">
          <VideoPreview file={uploadedVideo} />
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setActiveTab('upload')}
              className="flex-1"
            >
              <Upload className="mr-2 h-4 w-4" />
              Change Video
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setCameraOpen(true)}
              className="flex-1"
            >
              <Camera className="mr-2 h-4 w-4" />
              Record New
            </Button>
            <Button 
              variant="destructive" 
              onClick={clearVideo}
            >
              Clear
            </Button>
          </div>
        </div>
      ) : (
        // Input Selection Mode
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/20">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Video
            </TabsTrigger>
            <TabsTrigger value="record" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Record Video
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-4">
            <div
              className={cn(
                "bg-black/30 border-2 border-dashed rounded-lg p-8 text-center transition-all",
                isDragOver 
                  ? "border-primary bg-primary/10" 
                  : "border-gray-700 hover:border-gray-600",
                "cursor-pointer group"
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('video-upload')?.click()}
            >
              <input
                id="video-upload"
                type="file"
                accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className={cn(
                  "text-primary transition-transform group-hover:scale-110",
                  isDragOver && "scale-110"
                )}>
                  <Upload className="h-12 w-12" />
                </div>
                <div>
                  <p className="text-white font-medium">
                    {isDragOver ? "Drop your video here" : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    MP4, MOV, AVI, or WebM (max 20MB)
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="record" className="mt-4">
            <div className="bg-black/30 border border-gray-700 rounded-lg p-8 text-center">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="text-primary">
                  <Camera className="h-12 w-12" />
                </div>
                <div>
                  <p className="text-white font-medium mb-2">
                    Record your movement technique
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    Use your device camera to record a short video for analysis
                  </p>
                  <Button 
                    onClick={() => setCameraOpen(true)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Start Recording
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}

      <MovementCameraRecorder
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onVideoRecorded={handleCameraRecording}
      />
    </div>
  );
};
