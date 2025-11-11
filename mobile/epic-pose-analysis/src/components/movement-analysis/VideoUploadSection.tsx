
import { EnhancedVideoInput } from "./EnhancedVideoInput";

interface VideoUploadSectionProps {
  uploadedVideo: File | null;
  setUploadedVideo: (file: File | null) => void;
  setAnalysis: (analysis: string | null) => void;
}

export const VideoUploadSection = ({ uploadedVideo, setUploadedVideo, setAnalysis }: VideoUploadSectionProps) => {
  return (
    <EnhancedVideoInput
      uploadedVideo={uploadedVideo}
      setUploadedVideo={setUploadedVideo}
      setAnalysis={setAnalysis}
    />
  );
};
