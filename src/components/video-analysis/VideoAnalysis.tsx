
import { useState, useEffect, memo } from "react";
import { useLocation } from "react-router-dom";
import { LoadingState } from "./LoadingState";
import { LandingView } from "./LandingView";
import { EditorView } from "./EditorView";
import { useScriptGeneration } from "./hooks/useScriptGeneration";

export const VideoAnalysis = memo(() => {
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
    <div className="relative">
      <div className="rounded-lg overflow-hidden bg-black/40 backdrop-blur-sm">
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
});

VideoAnalysis.displayName = 'VideoAnalysis';
