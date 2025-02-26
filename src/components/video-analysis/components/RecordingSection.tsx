
import VideoRecorder from "../VideoRecorder";
import { VideoUpload } from "../VideoUpload";
import { Teleprompter } from "../Teleprompter";

interface RecordingSectionProps {
  onNarrate: () => void;
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  workoutScript: string;
  teleprompterPosition: number;
  setTeleprompterPosition: (position: number) => void;
}

export const RecordingSection = ({
  onNarrate,
  onFileSelect,
  selectedFile,
  workoutScript,
  teleprompterPosition,
  setTeleprompterPosition,
}: RecordingSectionProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <VideoRecorder onNarrate={onNarrate} />
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
