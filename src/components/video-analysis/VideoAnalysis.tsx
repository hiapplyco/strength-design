import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Editor } from "@/components/document-editor/Editor";
import { LoadingState } from "./LoadingState";
import { RecordingInterface } from "./RecordingInterface";
import { useScriptGeneration } from "./hooks/useScriptGeneration";

export const VideoAnalysis = () => {
  const location = useLocation();
  const [showRecorder, setShowRecorder] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [teleprompterPosition, setTeleprompterPosition] = useState(0);
  
  const {
    workoutScript,
    isGenerating,
    isReady,
    generateMonologue
  } = useScriptGeneration();

  useEffect(() => {
    if (location.state?.workoutScript) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = location.state.workoutScript;
      const plainText = tempDiv.textContent || tempDiv.innerText || "";
      
      generateMonologue(plainText);
      
      if (location.state.autoStartRecording) {
        setShowRecorder(true);
      }
    } else {
      setShowEditor(true);
    }
  }, [location.state]);

  const handleStartRecording = () => {
    setShowRecorder(true);
    if (workoutScript) {
      setShowEditor(false);
    } else {
      setShowEditor(true);
    }
  };

  if (isGenerating) {
    return <LoadingState />;
  }

  if (!showRecorder && !showEditor) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
        style={{
          backgroundImage: 'url("/lovable-uploads/842b2afa-8591-4d83-b092-99399dbeaa94.png")',
        }}>
        <div className="min-h-screen bg-gradient-to-b from-transparent via-black/75 to-black/75 backdrop-blur-sm">
          <div className="container mx-auto px-4 pt-16">
            <h1 className="text-4xl font-bold text-white mb-16 text-center">Video Analysis</h1>
            
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Button
                  onClick={handleStartRecording}
                  className="h-64 bg-accent hover:bg-accent/90 flex flex-col items-center justify-center gap-4 p-8 rounded-xl transition-all duration-300 hover:scale-105"
                >
                  <Camera className="h-24 w-24" />
                  <span className="text-2xl font-semibold">Start Recording</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage: 'url("/lovable-uploads/842b2afa-8591-4d83-b092-99399dbeaa94.png")',
      }}>
      <div className="min-h-screen bg-gradient-to-b from-transparent via-black/75 to-black/75 backdrop-blur-sm">
        <div className="container mx-auto px-4 pt-16">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Video Analysis</h1>
          
          <div className="max-w-7xl mx-auto">
            {isReady && showRecorder && (
              <RecordingInterface
                workoutScript={workoutScript}
                teleprompterPosition={teleprompterPosition}
                setTeleprompterPosition={setTeleprompterPosition}
              />
            )}

            {showEditor && !workoutScript && (
              <div className="flex flex-col space-y-4">
                <h2 className="text-2xl font-bold text-white mb-4">Create Your Script</h2>
                <div className="flex-grow">
                  <Editor 
                    onSave={(content) => {
                      const tempDiv = document.createElement('div');
                      tempDiv.innerHTML = content;
                      const plainText = tempDiv.textContent || tempDiv.innerText || "";
                      generateMonologue(plainText);
                      setShowEditor(false);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};