
import VideoRecorder from "../VideoRecorder";
import { VideoUpload } from "../VideoUpload";
import { Teleprompter } from "../Teleprompter";
import { useVideoUpload } from "../hooks/useVideoUpload";

interface RecordingSectionProps {
  onNarrate: () => void;
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  workoutScript: string;
  teleprompterPosition: number;
  setTeleprompterPosition: (position: number) => void;
  onVideoUploaded?: (url: string) => void;
}

export const RecordingSection = ({
  onNarrate,
  onFileSelect,
  selectedFile,
  workoutScript,
  teleprompterPosition,
  setTeleprompterPosition,
  onVideoUploaded,
}: RecordingSectionProps) => {
  // Use the video upload hook to handle the upload process
  const { uploadVideo } = useVideoUpload();

  const handleVideoUploaded = (url: string) => {
    if (onVideoUploaded) {
      onVideoUploaded(url);
    }
  };

  // Create a function that satisfies the onFileUpload prop requirement
  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      const chunks: Blob[] = [file];
      const mimeType = file.type;
      await uploadVideo(chunks, mimeType);
      // Return a placeholder URL since uploadVideo doesn't return the URL directly
      // In a real implementation, this would return the actual URL
      return URL.createObjectURL(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <VideoRecorder 
          onNarrate={onNarrate} 
          onVideoUploaded={handleVideoUploaded}
        />
        <VideoUpload 
          onFileSelect={onFileSelect}
          selectedFile={selectedFile}
          onFileUpload={handleFileUpload}
          onUploadComplete={handleVideoUploaded}
        />
      </div>
      <div className="space-y-4">
        <Teleprompter
          script={workoutScript}
          position={teleprompterPosition}
          setPosition={setTeleprompterPosition}
        />
      </div>
    </div>
  );
};
