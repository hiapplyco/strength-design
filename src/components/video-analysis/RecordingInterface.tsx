import { Teleprompter } from "./Teleprompter";
import VideoRecorder from "./VideoRecorder";

interface RecordingInterfaceProps {
  workoutScript: string;
  teleprompterPosition: number;
  setTeleprompterPosition: (position: number) => void;
}

export const RecordingInterface = ({
  workoutScript,
  teleprompterPosition,
  setTeleprompterPosition
}: RecordingInterfaceProps) => {
  return (
    <div className="bg-black/50 backdrop-blur-sm p-6 rounded-lg border border-gray-800 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col space-y-4">
          <h2 className="text-2xl font-bold text-white mb-4">Record Your Video</h2>
          <div className="flex-grow">
            <VideoRecorder />
          </div>
        </div>

        <div className="flex flex-col space-y-4">
          <h2 className="text-2xl font-bold text-white mb-4">Your Script</h2>
          <div className="flex-grow">
            <Teleprompter 
              script={workoutScript}
              onPositionChange={setTeleprompterPosition}
            />
          </div>
        </div>
      </div>
    </div>
  );
};