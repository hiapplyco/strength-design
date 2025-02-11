import { Editor } from "@/components/document-editor/Editor";
import { RecordingInterface } from "./RecordingInterface";
import { VideoRecorder } from "./VideoRecorder";
import { VideoUpload } from "./VideoUpload";
import { Teleprompter } from "./Teleprompter";
import { Dialog } from "@/components/ui/dialog";
import { useState } from "react";

interface EditorViewProps {
  showRecorder: boolean;
  showEditor: boolean;
  workoutScript: string;
  teleprompterPosition: number;
  setTeleprompterPosition: (position: number) => void;
  onEditorSave: (content: string) => void;
}

export function EditorView({
  showRecorder,
  showEditor,
  workoutScript,
  teleprompterPosition,
  setTeleprompterPosition,
  onEditorSave,
}: EditorViewProps) {
  const [showVoiceDialog, setShowVoiceDialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const generateNarration = async (script: string) => {
    setIsGenerating(true);
    // Logic to generate narration
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Record Your Video</h2>
      </div>

      {showEditor && (
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6">
          <Editor
            content={workoutScript}
            onChange={(content) => onEditorSave(content)}
          />
        </div>
      )}

      {showRecorder && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <VideoRecorder onNarrate={() => setShowVoiceDialog(true)} />
            <VideoUpload />
          </div>
          <div className="space-y-4">
            <Teleprompter
              content={workoutScript}
              position={teleprompterPosition}
              setPosition={setTeleprompterPosition}
            />
          </div>
        </div>
      )}

      <Dialog open={showVoiceDialog} onOpenChange={setShowVoiceDialog}>
        {/* Dialog content for narration */}
      </Dialog>
    </div>
  );
}
