
import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play,
  FileText,
  Loader2
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { VideoUpload } from "@/components/video-analysis/VideoUpload";
import { supabase } from "@/integrations/supabase/client";

export default function FormAnalysisPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisQuestion, setAnalysisQuestion] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upload");
  const { toast } = useToast();

  const handleFileSelected = (file: File | null) => {
    setSelectedFile(file);
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      // Upload video to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `mova-videos/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('videos')
        .upload(filePath, file);
      
      if (error) throw error;

      // Get public URL for the video
      const { data: urlData } = await supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      setVideoUrl(urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading video:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload video",
        variant: "destructive",
      });
      throw error;
    }
  };

  const analyzeVideo = async () => {
    if (!videoUrl || !analysisQuestion) {
      toast({
        title: "Missing Information",
        description: "Please upload a video and enter your analysis question.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResults(null);
    try {
      // Call the Supabase Edge Function for analysis
      const { data, error } = await supabase.functions.invoke('form-video-analysis', {
        body: {
          videoUrl,
          question: analysisQuestion
        }
      });

      if (error) throw error;
      
      setAnalysisResults(data);
      setActiveTab("results");
      toast({
        title: "Analysis Complete",
        description: "Your video has been analyzed!",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze video",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Form Analysis Dashboard
            </h1>
            <p className="text-xl text-white/80 mb-4">
              Analyze your lifting form with AI-powered feedback
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-8">
                <TabsTrigger value="upload">Upload & Analyze</TabsTrigger>
                <TabsTrigger value="results" disabled={!analysisResults}>Results</TabsTrigger>
              </TabsList>

              <TabsContent value="upload">
                <Card className="p-6">
                  <h2 className="text-2xl font-bold mb-6">Upload Your Video</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">1. Select your video</h3>
                      <VideoUpload 
                        onFileSelect={handleFileSelected} 
                        selectedFile={selectedFile} 
                        onFileUpload={handleFileUpload}
                        onUploadComplete={setVideoUrl}
                      />
                      {videoUrl && (
                        <div className="mt-4">
                          <h4 className="text-md font-medium mb-2">Video Preview</h4>
                          <video 
                            src={videoUrl} 
                            controls 
                            className="w-full max-h-[300px] bg-black rounded-lg"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">2. What would you like to analyze?</h3>
                      <Textarea
                        placeholder="Example: Analyze my squat form. Check for depth and back angle."
                        value={analysisQuestion}
                        onChange={(e) => setAnalysisQuestion(e.target.value)}
                        className="h-32"
                      />
                    </div>
                    
                    <div className="flex justify-center pt-4">
                      <Button 
                        onClick={analyzeVideo} 
                        disabled={!videoUrl || !analysisQuestion || isAnalyzing}
                        size="lg"
                        className="bg-primary hover:bg-primary/90"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Analyzing Video...
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-5 w-5" />
                            Start Analysis
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="results">
                {analysisResults && (
                  <div className="space-y-8">
                    {/* Video and Summary */}
                    <Card className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-bold mb-4">Your Video</h3>
                          <video 
                            src={videoUrl || ''} 
                            controls 
                            className="w-full bg-black rounded-lg"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold mb-4">AI Analysis</h3>
                          <ScrollArea className="h-[300px] rounded border p-4">
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <p>{analysisResults.analysis}</p>
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    </Card>

                    {/* Feedback */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Strengths */}
                      <Card className="p-6">
                        <h3 className="text-xl font-bold mb-4">Strengths</h3>
                        <ul className="space-y-2">
                          {analysisResults.strengths?.map((strength: string, i: number) => (
                            <li key={i} className="flex items-start">
                              <span className="text-green-500 mr-2 mt-1">✓</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>

                      {/* Areas to Improve */}
                      <Card className="p-6">
                        <h3 className="text-xl font-bold mb-4">Areas to Improve</h3>
                        <ul className="space-y-2">
                          {analysisResults.areas_for_improvement?.map((weakness: string, i: number) => (
                            <li key={i} className="flex items-start">
                              <span className="text-amber-500 mr-2 mt-1">⚠</span>
                              <span>{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </div>

                    {/* Recommendations and Injury Risk */}
                    <Card className="p-6">
                      <h3 className="text-xl font-bold mb-4">Training Recommendations</h3>
                      <ul className="space-y-2">
                        {analysisResults.recommendations?.map((rec: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <span className="text-blue-500 mr-2 mt-1">►</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>

                    {/* Export Button */}
                    <div className="text-center">
                      <Button className="bg-primary hover:bg-primary/90" disabled>
                        <FileText className="mr-2 h-4 w-4" />
                        Export Report (Coming Soon)
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </div>
  );
}
