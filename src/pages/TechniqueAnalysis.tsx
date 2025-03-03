
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, LoaderCircle } from "lucide-react";
import { VideoUpload } from "@/components/video-analysis/VideoUpload";
import { useVideoAnalysis } from "@/components/video-analysis/hooks/useVideoAnalysis";
import { LogoHeader } from "@/components/ui/logo-header";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const TechniqueAnalysis = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { analyzing, analysis, analyzeVideo } = useVideoAnalysis();
  const [publicUrl, setPublicUrl] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const handleAnalyzeVideo = () => {
    if (publicUrl) {
      analyzeVideo(publicUrl, customPrompt || undefined);
    }
  };

  // Update this function to save the URL when a video is uploaded
  const handleVideoUploaded = (url: string) => {
    setPublicUrl(url);
  };

  const handleUpload = async (file: File) => {
    if (!file) return;
    
    // Upload logic will be handled by supabase client directly
    const fileName = `videos/technique_${Date.now()}_${file.name}`;
    
    try {
      const { data: storageData, error: storageError } = await import('@/integrations/supabase/client')
        .then(({ supabase }) => supabase.storage
          .from('videos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })
        );
      
      if (storageError) throw storageError;
      
      const { data } = await import('@/integrations/supabase/client')
        .then(({ supabase }) => supabase.storage
          .from('videos')
          .getPublicUrl(fileName)
        );
      
      if (data?.publicUrl) {
        setPublicUrl(data.publicUrl);
      }
    } catch (error) {
      console.error("Error uploading video:", error);
    }
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
                Upload a video of your jiu-jitsu technique for expert AI analysis and feedback
              </p>
            </div>
            
            <Card className="bg-black/50 backdrop-blur-sm border border-gray-800 max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="text-xl">Technique Analysis</CardTitle>
                <CardDescription>
                  Upload a video of your jiu-jitsu technique for expert AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="video">Video</Label>
                    <VideoUpload 
                      onFileSelect={setSelectedFile}
                      selectedFile={selectedFile}
                      onFileUpload={handleUpload}
                      onUploadComplete={handleVideoUploaded}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="custom-prompt">Custom Analysis Instructions (Optional)</Label>
                    <Textarea 
                      id="custom-prompt"
                      placeholder="Add specific instructions for the analysis, e.g., 'Focus on my guard passing technique' or leave blank for standard analysis."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="h-24"
                      borderStyle="multicolor"
                    />
                  </div>
                </div>
                
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
