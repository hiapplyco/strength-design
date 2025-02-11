
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { LoadingState } from "./LoadingState";
import { LandingView } from "./LandingView";
import { EditorView } from "./EditorView";
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

  const handleEditorSave = (content: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";
    generateMonologue(plainText);
    setShowEditor(false);
  };

  if (isGenerating) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-[calc(100vh-16rem)] bg-cover bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage: 'url("/lovable-uploads/842b2afa-8591-4d83-b092-99399dbeaa94.png")',
      }}>
      <div className="min-h-[calc(100vh-16rem)] bg-gradient-to-b from-transparent via-black/75 to-black/75 backdrop-blur-sm">
        {!showRecorder && !showEditor ? (
          <LandingView onStartRecording={handleStartRecording} />
        ) : (
          <EditorView
            showRecorder={showRecorder}
            showEditor={showEditor}
            workoutScript={workoutScript}
            teleprompterPosition={teleprompterPosition}
            setTeleprompterPosition={setTeleprompterPosition}
            onEditorSave={handleEditorSave}
          />
        )}
      </div>
    </div>
  );
};
