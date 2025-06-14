
import { Editor } from "@/components/document-editor/Editor";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useSharedContent } from "./hooks/useSharedContent";
import { ShareDialog } from "./components/ShareDialog";
import { VoiceGenerationDialog } from "./components/VoiceGenerationDialog";
import { RecordingSection } from "./components/RecordingSection";

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("TX3LPaxmHKxFdv7VOQHJ");
  const [autoRegenEnabled, setAutoRegenEnabled] = useState(false);
  const { isSharing, sharedLink, shareContent } = useSharedContent();

  const generateNarration = async (voiceId: string) => {
    if (!workoutScript) {
      toast({
        title: "Error",
        description: "No content to narrate",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = workoutScript;
      const plainText = tempDiv.textContent || tempDiv.innerText || "";

      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: plainText }
      });

      if (error) throw error;

      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      toast({
        title: "Success",
        description: "Audio narration generated successfully!",
      });
    } catch (error) {
      console.error('Error generating narration:', error);
      toast({
        title: "Error",
        description: "Failed to generate narration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Record Your Video</h2>
        <ShareDialog 
          isSharing={isSharing}
          sharedLink={sharedLink}
          onShare={() => shareContent(workoutScript)}
          workoutScript={workoutScript}
        />
      </div>

      {showEditor && (
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6">
          <Editor 
            content={workoutScript}
            onSave={onEditorSave}
          />
        </div>
      )}

      {showRecorder && (
        <RecordingSection
          onNarrate={() => setShowVoiceDialog(true)}
          onFileSelect={setSelectedFile}
          selectedFile={selectedFile}
          workoutScript={workoutScript}
          teleprompterPosition={teleprompterPosition}
          setTeleprompterPosition={setTeleprompterPosition}
        />
      )}

      <VoiceGenerationDialog
        showDialog={showVoiceDialog}
        onOpenChange={setShowVoiceDialog}
        isGenerating={isGenerating}
        audioUrl={audioUrl}
        onGenerateNarration={generateNarration}
        selectedVoiceId={selectedVoiceId}
        onVoiceChange={setSelectedVoiceId}
        autoRegenEnabled={autoRegenEnabled}
        onAutoRegenChange={setAutoRegenEnabled}
      />
    </div>
  );
}
