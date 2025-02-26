
import { useState, useEffect, memo, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { LoadingSpinner } from "@/components/layout/app-content/LoadingSpinner";
import { LoadingState } from "./LoadingState";
import { LandingView } from "./LandingView";
import { EditorView } from "./EditorView";
import { useScriptGeneration } from "./hooks/useScriptGeneration";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const VideoRecorder = lazy(() => import('./VideoRecorder'));

export const VideoAnalysis = memo(() => {
  const location = useLocation();
  const [showRecorder, setShowRecorder] = useState(() => {
    const saved = sessionStorage.getItem('video-analysis-recorder');
    return saved ? JSON.parse(saved) : false;
  });
  const [showEditor, setShowEditor] = useState(() => {
    const saved = sessionStorage.getItem('video-analysis-editor');
    return saved ? JSON.parse(saved) : false;
  });
  const [teleprompterPosition, setTeleprompterPosition] = useState(() => {
    const saved = sessionStorage.getItem('video-analysis-teleprompter');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [sharedLink, setSharedLink] = useState(() => {
    const saved = sessionStorage.getItem('video-analysis-shared-link');
    return saved || '';
  });
  
  const {
    workoutScript,
    isGenerating,
    isReady,
    generateMonologue
  } = useScriptGeneration();

  // Persist state changes to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('video-analysis-recorder', JSON.stringify(showRecorder));
  }, [showRecorder]);

  useEffect(() => {
    sessionStorage.setItem('video-analysis-editor', JSON.stringify(showEditor));
  }, [showEditor]);

  useEffect(() => {
    sessionStorage.setItem('video-analysis-teleprompter', teleprompterPosition.toString());
  }, [teleprompterPosition]);

  useEffect(() => {
    sessionStorage.setItem('video-analysis-shared-link', sharedLink);
  }, [sharedLink]);

  // Handle initial state from location
  useEffect(() => {
    if (location.state?.workoutScript) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = location.state.workoutScript;
      const plainText = tempDiv.textContent || tempDiv.innerText || "";
      
      generateMonologue(plainText);
      
      if (location.state.autoStartRecording) {
        setShowRecorder(true);
      }

      // Set shared link if provided in location state
      if (location.state.shareableLink) {
        setSharedLink(location.state.shareableLink);
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

  const handleCopyLink = () => {
    if (sharedLink) {
      navigator.clipboard.writeText(sharedLink);
      toast({
        title: "Link Copied",
        description: "The shareable link has been copied to your clipboard.",
      });
    }
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
          <>
            <Suspense fallback={<LoadingSpinner />}>
              <EditorView
                showRecorder={showRecorder}
                showEditor={showEditor}
                workoutScript={workoutScript}
                teleprompterPosition={teleprompterPosition}
                setTeleprompterPosition={setTeleprompterPosition}
                onEditorSave={handleEditorSave}
              />
            </Suspense>
            {sharedLink && (
              <div className="p-4 mt-4">
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="gap-2 text-white hover:text-white/80"
                >
                  <Link2 className="w-4 h-4" />
                  Copy Shareable Link
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

VideoAnalysis.displayName = 'VideoAnalysis';
