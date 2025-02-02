import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Teleprompter } from "./Teleprompter";
import VideoRecorder from "./VideoRecorder";
import { Editor } from "@/components/document-editor/Editor";
import { supabase } from "@/integrations/supabase/client";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { useToast } from "@/hooks/use-toast";

export const VideoAnalysis = () => {
  const location = useLocation();
  const [showRecorder, setShowRecorder] = useState(false);
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [teleprompterPosition, setTeleprompterPosition] = useState(0);
  const [workoutScript, setWorkoutScript] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const { toast } = useToast();

  const generateMonologue = async (content: string) => {
    try {
      setIsGenerating(true);
      console.log('Generating monologue for content:', content);
      
      const { data, error } = await supabase.functions.invoke('generate-workout-monologue', {
        body: {
          workoutPlan: content
        }
      });

      if (error) {
        console.error('Error generating monologue:', error);
        toast({
          title: "Error",
          description: "Failed to generate the script. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
      
      if (data?.monologue) {
        console.log('Generated monologue:', data.monologue);
        // Format the monologue by replacing markdown headers and adding proper spacing
        const formattedMonologue = data.monologue
          .replace(/###\s+/g, '\n\n')  // Replace markdown headers with line breaks
          .replace(/\n\s*\n/g, '\n\n')  // Normalize multiple line breaks
          .trim();
        
        setWorkoutScript(formattedMonologue);
        setShowTeleprompter(true);
        setIsReady(true);
        toast({
          title: "Success",
          description: "Your influencer script is ready!",
        });
        return;
      }
    } catch (error) {
      console.error('Error in generateMonologue:', error);
      // Fallback to original content if monologue generation fails
      setWorkoutScript(content);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (location.state?.workoutScript) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = location.state.workoutScript;
      const plainText = tempDiv.textContent || tempDiv.innerText || "";
      
      // Generate monologue from the content
      generateMonologue(plainText);
      
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
    if (workoutScript) {
      setShowTeleprompter(true);
    } else {
      setShowEditor(true);
    }
  };

  if (!showRecorder && !showTeleprompter && !showEditor) {
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

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
        style={{
          backgroundImage: 'url("/lovable-uploads/842b2afa-8591-4d83-b092-99399dbeaa94.png")',
        }}>
        <div className="min-h-screen bg-gradient-to-b from-transparent via-black/75 to-black/75 backdrop-blur-sm flex items-center justify-center">
          <div className="max-w-2xl mx-auto text-center">
            <LoadingIndicator className="scale-150">
              <h2 className="text-2xl font-bold text-white mb-4">Creating Your Influencer Script</h2>
              <p className="text-gray-300">We're crafting an engaging script for your workout video...</p>
            </LoadingIndicator>
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
            <div className="bg-black/50 backdrop-blur-sm p-6 rounded-lg border border-gray-800 mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {isReady && showRecorder && (
                  <div className="flex flex-col space-y-4">
                    <h2 className="text-2xl font-bold text-white mb-4">Record Your Video</h2>
                    <div className="flex-grow">
                      <VideoRecorder />
                    </div>
                  </div>
                )}

                {showTeleprompter && (
                  <div className="flex flex-col space-y-4">
                    <h2 className="text-2xl font-bold text-white mb-4">Your Script</h2>
                    <div className="flex-grow">
                      {workoutScript && (
                        <Teleprompter 
                          script={workoutScript}
                          onPositionChange={setTeleprompterPosition}
                        />
                      )}
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
                          generateMonologue(plainText);
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