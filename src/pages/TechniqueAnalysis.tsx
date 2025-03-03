
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, LoaderCircle } from "lucide-react";
import { RecordingSection } from "@/components/video-analysis/components/RecordingSection";
import { useState } from "react";
import { useScriptGeneration } from "@/components/video-analysis/hooks/useScriptGeneration";
import { useVideoAnalysis } from "@/components/video-analysis/hooks/useVideoAnalysis";
import { LogoHeader } from "@/components/ui/logo-header";

const TechniqueAnalysis = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [teleprompterPosition, setTeleprompterPosition] = useState(0);
  const { workoutScript, isGenerating, generateMonologue } = useScriptGeneration();
  const { analyzing, analysis, analyzeVideo } = useVideoAnalysis();
  const [publicUrl, setPublicUrl] = useState<string>('');

  const handleAnalyzeVideo = () => {
    if (publicUrl) {
      analyzeVideo(publicUrl);
    }
  };

  // Update this function to save the URL when a video is uploaded
  const handleVideoUploaded = (url: string) => {
    setPublicUrl(url);
  };

  return (
    <div className="min-h-screen w-full">
      <div className="relative isolate">
        <div 
          className="fixed inset-0 -z-10 bg-black"
          style={{
            backgroundImage: 'url("/lovable-uploads/08e5da43-23c6-459a-bea3-16ae71e6ceb5.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        </div>
        
        <main className="relative z-10 w-full">
          <div className="container mx-auto px-4 pt-20">
            <div className="text-center mb-8 md:mb-12">
              <LogoHeader>Jiu-Jitsu Technique Analysis</LogoHeader>
              <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
                Upload or record a video of your jiu-jitsu technique for expert AI analysis and feedback
              </p>
            </div>
            
            <Card className="bg-black/50 backdrop-blur-sm border border-gray-800 max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-xl">Technique Analysis</CardTitle>
                <CardDescription>
                  Upload or record a video of your jiu-jitsu technique for expert AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RecordingSection
                  onNarrate={() => {}}
                  onFileSelect={setSelectedFile}
                  selectedFile={selectedFile}
                  workoutScript={""}
                  teleprompterPosition={teleprompterPosition}
                  setTeleprompterPosition={setTeleprompterPosition}
                  onVideoUploaded={handleVideoUploaded}
                />
                
                {publicUrl && (
                  <Button 
                    onClick={handleAnalyzeVideo} 
                    disabled={analyzing}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    {analyzing ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Analyzing technique...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Analyze Technique
                      </>
                    )}
                  </Button>
                )}
                
                {analysis && (
                  <div className="mt-4 bg-black/40 p-4 rounded-md border border-gray-700">
                    <h3 className="text-lg font-medium mb-4">Analysis Results</h3>
                    <div className="prose prose-invert max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: analysis.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TechniqueAnalysis;
