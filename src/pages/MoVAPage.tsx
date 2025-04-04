
import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Video, 
  BarChart3, 
  Upload, 
  Play,
  FileText,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { VideoUpload } from "@/components/video-analysis/VideoUpload";
import { supabase } from "@/integrations/supabase/client";

export default function MoVAPage() {
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

  const handleFileUpload = async (file: File) => {
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
    try {
      // Call the Supabase Edge Function for analysis
      const { data, error } = await supabase.functions.invoke('baseball-video-analysis', {
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
        description: "Your baseball video has been analyzed!",
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

  // Helper function to render metrics with color-coding
  const renderMetricValue = (value: number) => {
    let color = "text-gray-500";
    if (value >= 80) color = "text-green-500";
    else if (value >= 50) color = "text-yellow-500";
    else color = "text-red-500";
    
    return <span className={`text-xl font-bold ${color}`}>{value}%</span>;
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#1a237e] pb-20">
      {/* Header Section */}
      <section className="bg-gradient-to-r from-[#1a237e] to-[#283593] py-16">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              MoVA - Motion Video Analysis
            </h1>
            <p className="text-xl text-white/80 mb-4">
              Advanced baseball motion analysis powered by AI
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
                  <h2 className="text-2xl font-bold mb-6">Upload Baseball Video</h2>
                  
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
                        placeholder="Example: Analyze the pitcher's mechanics, focus on arm angle and torso rotation."
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
                        className="bg-[#1a237e] hover:bg-[#283593]"
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
                          <h3 className="text-lg font-bold mb-4">Video Analysis</h3>
                          <video 
                            src={videoUrl || ''} 
                            controls 
                            className="w-full bg-black rounded-lg"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold mb-4">Summary</h3>
                          <ScrollArea className="h-[300px] rounded border p-4">
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium">Visual Description</h4>
                                <p className="text-gray-700">{analysisResults.visual_description || "No description available"}</p>
                              </div>
                              <div>
                                <h4 className="font-medium">Power Score</h4>
                                <div className="text-2xl font-bold">{analysisResults.power_score_est || 0}<span className="text-lg text-gray-500">/200</span></div>
                              </div>
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    </Card>

                    {/* Metrics */}
                    <Card className="p-6">
                      <h3 className="text-xl font-bold mb-4">Performance Metrics</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {analysisResults.metrics && Object.entries(analysisResults.metrics).map(([name, metric]: [string, any]) => (
                          <Card key={name} className="p-4 border-t-4" style={{ borderTopColor: metric.percentile_est >= 80 ? '#4caf50' : metric.percentile_est >= 50 ? '#ffb300' : '#f44336' }}>
                            <h4 className="font-bold text-lg">{name}</h4>
                            <div className="mt-2">{renderMetricValue(metric.percentile_est)}</div>
                            <p className="text-sm text-gray-600 mt-1">{metric.value_desc}</p>
                            <p className="text-xs font-medium mt-2">Status: {metric.status}</p>
                          </Card>
                        ))}
                      </div>
                    </Card>

                    {/* Feedback */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Strengths */}
                      <Card className="p-6">
                        <h3 className="text-xl font-bold mb-4">Strengths</h3>
                        <ul className="space-y-2">
                          {analysisResults.strengths_feedback?.map((strength: string, i: number) => (
                            <li key={i} className="flex">
                              <span className="text-green-500 mr-2">✓</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </Card>

                      {/* Areas to Improve */}
                      <Card className="p-6">
                        <h3 className="text-xl font-bold mb-4">Areas to Improve</h3>
                        <ul className="space-y-2">
                          {analysisResults.weaknesses_feedback?.map((weakness: string, i: number) => (
                            <li key={i} className="flex">
                              <span className="text-amber-500 mr-2">⚠</span>
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </div>

                    {/* Recommendations and Injury Risk */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Recommendations */}
                      <Card className="p-6">
                        <h3 className="text-xl font-bold mb-4">Training Recommendations</h3>
                        <ul className="space-y-2">
                          {analysisResults.overall_recommendations?.map((rec: string, i: number) => (
                            <li key={i} className="flex">
                              <span className="text-blue-500 mr-2">►</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </Card>

                      {/* Injury Risk */}
                      <Card className="p-6">
                        <h3 className="text-xl font-bold mb-4">Injury Risk Assessment</h3>
                        {analysisResults.injury_risk_est && (
                          <div className="space-y-4">
                            {Object.entries(analysisResults.injury_risk_est).map(([area, risk]: [string, any]) => (
                              <div key={area} className="flex items-center">
                                <div className="w-24 font-medium">{area}:</div>
                                <div className="flex-1 bg-gray-200 rounded-full h-6">
                                  <div 
                                    className={`h-6 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                                      risk === 'High' ? 'bg-red-500 w-full' : 
                                      risk === 'Moderate' ? 'bg-yellow-500 w-2/3' : 
                                      'bg-green-500 w-1/3'
                                    }`}
                                  >
                                    {risk}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    </div>

                    {/* Export Button */}
                    <div className="text-center">
                      <Button className="bg-[#1a237e] hover:bg-[#283593]" disabled>
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
