import { useRef } from "react";
import { toast } from "sonner";

interface VideoUploadSectionProps {
  uploadedVideo: File | null;
  setUploadedVideo: (file: File | null) => void;
  setAnalysis: (analysis: string | null) => void;
}

export const VideoUploadSection = ({ uploadedVideo, setUploadedVideo, setAnalysis }: VideoUploadSectionProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file type
      const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload an MP4, MOV, or AVI video file");
        return;
      }
      
      // Validate file size (20MB max for Gemini API)
      const MAX_SIZE = 20 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        toast.error("Video file size must be less than 20MB");
        return;
      }
      
      setUploadedVideo(file);
      setAnalysis(null); // Clear previous analysis
      toast.success(`Video "${file.name}" selected for analysis`);
    }
  };
  
  return (
    <div>
      <h3 className="text-lg font-medium text-white mb-2">1. Upload your technique video</h3>
      <div className="bg-black/30 border border-gray-700 rounded-lg p-4 text-center">
        <input 
          ref={fileInputRef}
          type="file" 
          accept="video/mp4,video/quicktime,video/x-msvideo" 
          onChange={handleVideoChange}
          className="hidden"
          id="video-upload"
        />
        <label htmlFor="video-upload" className="cursor-pointer">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="text-primary mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="23 7 16 12 23 17 23 7"/>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
            </div>
            <p className="text-white mb-1">
              {uploadedVideo ? uploadedVideo.name : "Click to upload video"}
            </p>
            <p className="text-sm text-gray-400">MP4, MOV, or AVI (max 20MB)</p>
          </div>
        </label>
      </div>
    </div>
  );
};
