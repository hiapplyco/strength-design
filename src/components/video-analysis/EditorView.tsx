
import { Editor } from "@/components/document-editor/Editor";
import { RecordingInterface } from "./RecordingInterface";

interface EditorViewProps {
  showRecorder: boolean;
  showEditor: boolean;
  workoutScript: string;
  teleprompterPosition: number;
  setTeleprompterPosition: (position: number) => void;
  onEditorSave: (content: string) => void;
}

export const EditorView = ({
  showRecorder,
  showEditor,
  workoutScript,
  teleprompterPosition,
  setTeleprompterPosition,
  onEditorSave,
}: EditorViewProps) => {
  return (
    <div className="container mx-auto px-4 pt-8 md:pt-16">
      <div className="max-w-7xl mx-auto">
        {showRecorder && (
          <RecordingInterface
            workoutScript={workoutScript}
            teleprompterPosition={teleprompterPosition}
            setTeleprompterPosition={setTeleprompterPosition}
          />
        )}

        {showEditor && !workoutScript && (
          <div className="flex flex-col space-y-4">
            <div className="flex-grow">
              <Editor onSave={onEditorSave} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
