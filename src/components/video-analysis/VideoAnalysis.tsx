import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Teleprompter } from "./Teleprompter";
import VideoRecorder from "./VideoRecorder";
import { Editor } from "@/components/document-editor/Editor";
import { supabase } from "@/integrations/supabase/client";

export const VideoAnalysis = () => {
  const location = useLocation();
  const [showRecorder, setShowRecorder] = useState(false);
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [teleprompterPosition, setTeleprompterPosition] = useState(0);
  const [workoutScript, setWorkoutScript] = useState("");
  const [showEditor, setShowEditor] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('VideoAnalysis mounted');
    console.log('Initial showRecorder:', showRecorder);
    console.log('Initial showTeleprompter:', showTeleprompter);
  }, []);

  useEffect(() => {
    console.log('State changed - showRecorder:', showRecorder, 'showTeleprompter:', showTeleprompter);
  }, [showRecorder, showTeleprompter]);

  const generateMonologue = async (content: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-workout-monologue', {
        body: {
          workoutPlan: content,
          dayToSpeak: "today",
          warmup: "Standard warmup",
          wod: content,
          notes: "Focus on form and technique"
        }
      });

      if (error) throw error;
      
      if (data?.monologue) {
        setWorkoutScript(data.monologue);
        return;
      }
    } catch (error) {
      console.error('Error generating monologue:', error);
      // Fallback to original content if monologue generation fails
      setWorkoutScript(content);
    }
  };

  useEffect(() => {
    if (location.state?.workoutScript) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = location.state.workoutScript;
      const plainText = tempDiv.textContent || tempDiv.innerText || "";
      
      // Generate monologue from the content
      generateMonologue(plainText);
      setShowTeleprompter(true);
      
      // Auto-start if coming from document editor
      if (location.state.autoStartRecording) {
        setShowRecorder(true);
      }
    } else {
      setShowEditor(true);
    }
  }, [location.state]);

  const handleStartRecording = () => {
    setShowRecorder(true);
    // If we have a workout script, show teleprompter, otherwise show editor
    if (workoutScript) {
      setShowTeleprompter(true);
    } else {
      setShowEditor(true);
    }
  };

  // Render initial buttons if neither recorder nor teleprompter is active
  if (!showRecorder && !showTeleprompter && !showEditor) {
    console.log('Rendering initial buttons view');
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

  // Only render video recorder or teleprompter after button click
  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage: 'url("/lovable-uploads/842b2afa-8591-4d83-b092-99399dbeaa94.png")',
      }}>
      <div className="min-h-screen bg-gradient-to-b from-transparent via-black/75 to-black/75 backdrop-blur-sm">
        <div className="container mx-auto px-4 pt-16">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Video Analysis</h1>
          
          <div className="max-w-7xl mx-auto">
            <div className="bg-black/50 backdrop-blur-sm p-6 rounded-lg border border-gray-800 mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {showRecorder && (
                  <div className="flex flex-col space-y-4">
                    <h2 className="text-2xl font-bold text-white mb-4">Record Your Video</h2>
                    <div className="flex-grow">
                      <VideoRecorder />
                    </div>
                  </div>
                )}

                {showTeleprompter && workoutScript && (
                  <div className="flex flex-col space-y-4">
                    <h2 className="text-2xl font-bold text-white mb-4">Workout Script</h2>
                    <div className="flex-grow">
                      <Teleprompter 
                        script={workoutScript}
                        onPositionChange={setTeleprompterPosition}
                      />
                    </div>
                  </div>
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
                          setWorkoutScript(plainText);
                          setShowEditor(false);
                          setShowTeleprompter(true);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};