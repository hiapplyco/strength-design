
import { LogoHeader } from "@/components/ui/logo-header";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { createClient } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

const TechniqueAnalysis = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [question, setQuestion] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create Supabase client
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Handle file selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file type
      const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload an MP4, MOV, or AVI video file");
        return;
      }
      
      // Validate file size (20MB max for Gemini API)
      const MAX_SIZE = 20 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        toast.error("Video file size must be less than 20MB");
        return;
      }
      
      setUploadedVideo(file);
      setAnalysis(null); // Clear previous analysis
      toast.success(`Video "${file.name}" selected for analysis`);
    }
  };

  // Reset form
  const handleReset = () => {
    setUploadedVideo(null);
    setQuestion("");
    setAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit for analysis
  const handleSubmitForAnalysis = async () => {
    if (!uploadedVideo) {
      toast.error("Please upload a video first");
      return;
    }
    
    if (!question.trim()) {
      toast.error("Please enter a question about your technique");
      return;
    }

    setIsLoading(true);
    setAnalysis(null);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('video', uploadedVideo);
      formData.append('query', question);

      console.log("Calling bjj-analyzer function...");
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('bjj-analyzer', {
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (error) {
        throw new Error(error.message || "Analysis failed");
      }

      console.log("Analysis result:", data);
      
      if (data && data.analysis) {
        setAnalysis(data.analysis);
        toast.success("Analysis complete!");
      } else {
        throw new Error("No analysis data returned");
      }
    } catch (error) {
      console.error("Error during analysis:", error);
      toast.error(error.message || "Failed to analyze video. Please try again later.");
    } finally {
      setIsLoading(false);
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
          <div className="container mx-auto px-4 pt-20 pb-12">
            <div className="text-center mb-8 md:mb-12">
              <LogoHeader>Jiu-Jitsu Technique Analysis</LogoHeader>
              <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
                Upload a video of your jiu-jitsu technique for expert AI analysis and feedback
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto rounded-lg overflow-hidden border border-gray-800 shadow-xl bg-black/40 p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Upload & Question Section */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">1. Upload your technique video</h3>
                    <div className="bg-black/30 border border-gray-700 rounded-lg p-4 text-center">
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="video/mp4,video/quicktime,video/x-msvideo" 
                        onChange={handleVideoChange}
                        className="hidden"
                        id="video-upload"
                      />
                      <label htmlFor="video-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center py-6">
                          <div className="text-primary mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="23 7 16 12 23 17 23 7"/>
                              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                            </svg>
                          </div>
                          <p className="text-white mb-1">
                            {uploadedVideo ? uploadedVideo.name : "Click to upload video"}
                          </p>
                          <p className="text-sm text-gray-400">MP4, MOV, or AVI (max 20MB)</p>
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">2. Ask a specific question</h3>
                    <Textarea 
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="E.g., How can I improve my triangle choke setup? What am I doing wrong with my guard passing?"
                      className="h-32 bg-black/30 border-gray-700 text-white"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button 
                      onClick={handleSubmitForAnalysis} 
                      disabled={!uploadedVideo || !question.trim() || isLoading}
                      className="w-full"
                    >
                      {isLoading ? "Analyzing..." : "Analyze My Technique"}
                    </Button>
                    <Button variant="outline" onClick={handleReset} disabled={isLoading}>
                      Reset
                    </Button>
                  </div>
                </div>
                
                {/* Results Section */}
                <div className="bg-black/20 border border-gray-700 rounded-lg p-4 min-h-[350px]">
                  <h3 className="text-lg font-medium text-white mb-4">Analysis Results</h3>
                  
                  {isLoading && (
                    <div className="flex items-center justify-center h-[300px]">
                      <LoadingIndicator>
                        Analyzing your technique...
                      </LoadingIndicator>
                    </div>
                  )}
                  
                  {!isLoading && !analysis && (
                    <div className="flex flex-col items-center justify-center h-[300px] text-center text-gray-400">
                      <div className="text-primary mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="16" x2="12" y2="12"/>
                          <line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                      </div>
                      <p>Upload a video and ask a question to receive expert feedback</p>
                    </div>
                  )}
                  
                  {!isLoading && analysis && (
                    <div className="overflow-y-auto h-[300px] pr-2 text-white/90">
                      <div className="prose prose-invert max-w-none prose-headings:text-primary prose-strong:text-white">
                        {/* Split analysis into paragraphs and handle markdown-style headers */}
                        {analysis.split('\n').map((paragraph, i) => {
                          if (paragraph.startsWith('##')) {
                            return <h3 key={i} className="text-primary font-medium mt-4">{paragraph.replace('##', '').trim()}</h3>;
                          } else if (paragraph.startsWith('•')) {
                            return <li key={i} className="ml-4">{paragraph.substring(1).trim()}</li>;
                          } else if (paragraph.trim() === '') {
                            return <br key={i} />;
                          } else {
                            return <p key={i}>{paragraph}</p>;
                          }
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="max-w-3xl mx-auto mt-8 p-4 bg-black/30 rounded-lg border border-gray-800">
              <h3 className="text-lg font-medium text-white mb-2">How to get the best analysis:</h3>
              <ul className="list-disc pl-5 space-y-2 text-white/80">
                <li>Record clear video from a stable position where your entire body is visible</li>
                <li>Perform the technique at a moderate speed so details are visible</li>
                <li>Ask specific questions about aspects you want to improve</li>
                <li>For partner techniques, ensure both practitioners are visible</li>
                <li>Good lighting makes a significant difference in analysis quality</li>
              </ul>
              <p className="mt-4 text-sm text-white/60">
                Note: All videos are processed securely and not stored permanently after analysis.
                Your feedback helps us improve - let us know how this tool is working for you!
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TechniqueAnalysis;
