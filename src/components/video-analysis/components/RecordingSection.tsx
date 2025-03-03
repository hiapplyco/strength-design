
import VideoRecorder from "../VideoRecorder";
import { VideoUpload } from "../VideoUpload";
import { Teleprompter } from "../Teleprompter";
import { useEffect } from "react";

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
  const handleVideoUploaded = (url: string) => {
    if (onVideoUploaded) {
      onVideoUploaded(url);
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
