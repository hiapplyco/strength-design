
import { useState } from 'react';
import { RecordingSection } from './components/RecordingSection';
import { useScriptGeneration } from './hooks/useScriptGeneration';
import { useVideoAnalysis } from './hooks/useVideoAnalysis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, LoaderCircle } from 'lucide-react';

export const VideoAnalysis = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [teleprompterPosition, setTeleprompterPosition] = useState(0);
  const { workoutScript, isGenerating, isReady, generateMonologue } = useScriptGeneration();
  const { analyzing, analysis, analyzeVideo } = useVideoAnalysis();
  const [publicUrl, setPublicUrl] = useState<string>('');

  const handleNarrate = () => {
    const workoutContent = "Please create a professional fitness instructor script for a 5-minute video that covers proper form for squats, lunges, and planks. Include a brief introduction, detailed instructions for each exercise focusing on alignment and common mistakes to avoid, and a motivational conclusion.";
    generateMonologue(workoutContent);
  };

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
    <Tabs defaultValue="record" className="w-full max-w-5xl mx-auto">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="record">Record & Script</TabsTrigger>
        <TabsTrigger value="analyze">Technique Analysis</TabsTrigger>
      </TabsList>
      
      <TabsContent value="record" className="space-y-4">
        <RecordingSection
          onNarrate={handleNarrate}
          onFileSelect={setSelectedFile}
          selectedFile={selectedFile}
          workoutScript={workoutScript}
          teleprompterPosition={teleprompterPosition}
          setTeleprompterPosition={setTeleprompterPosition}
        />
      </TabsContent>
      
      <TabsContent value="analyze" className="space-y-4">
        <Card className="bg-black/50 backdrop-blur-sm border border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl">Jiu-Jitsu Technique Analysis</CardTitle>
            <CardDescription>
              Upload or record a video of your jiu-jitsu technique for expert AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RecordingSection
              onNarrate={handleNarrate}
              onFileSelect={setSelectedFile}
              selectedFile={selectedFile}
              workoutScript={workoutScript}
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
                    Analyzing video...
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
      </TabsContent>
    </Tabs>
  );
};
