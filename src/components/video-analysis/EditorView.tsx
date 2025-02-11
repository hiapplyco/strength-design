
import { Editor } from "@/components/document-editor/Editor";
import { VideoRecorder } from "./VideoRecorder";
import { VideoUpload } from "./VideoUpload";
import { Teleprompter } from "./Teleprompter";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/layout/app-content/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
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
            onSave={onEditorSave}
          />
        </div>
      )}

      {showRecorder && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <VideoRecorder onNarrate={() => setShowVoiceDialog(true)} />
            <VideoUpload 
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
            />
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
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Choose Voice Type</DialogTitle>
          <DialogDescription>
            Select a voice for your narration
          </DialogDescription>
          <div className="flex flex-col gap-4">
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => generateNarration('EkK5I93UQWFDigLMpZcX')}
                disabled={isGenerating}
              >
                Male Voice
              </Button>
              <Button
                variant="outline"
                onClick={() => generateNarration('kPzsL2i3teMYv0FxEYQ6')}
                disabled={isGenerating}
              >
                Female Voice
              </Button>
            </div>
            
            {isGenerating && (
              <div className="flex flex-col items-center gap-2">
                <LoadingSpinner />
                <p className="text-sm text-muted-foreground">Generating narration...</p>
              </div>
            )}

            {audioUrl && !isGenerating && (
              <div className="flex flex-col gap-2">
                <audio controls className="w-full">
                  <source src={audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
                <Button
                  variant="outline"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = audioUrl;
                    a.download = 'narration.mp3';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                >
                  Download Audio
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
