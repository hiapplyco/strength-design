
import { AnalysisForm } from "./AnalysisForm";
import { AnalysisResults } from "./AnalysisResults";
import { AnalysisTips } from "./AnalysisTips";
import { StreamlitEmbed } from "./StreamlitEmbed";
import { StreamlitConfig } from "./StreamlitConfig";
import { LogoHeader } from "@/components/ui/logo-header";
import { useTechniqueAnalysis } from "@/hooks/useTechniqueAnalysis";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserIcon } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const TechniqueAnalysisContent = () => {
  const {
    isLoading,
    isSaving,
    uploadedVideo,
    setUploadedVideo,
    question,
    setQuestion,
    analysis,
    setAnalysis,
    handleReset,
    handleSubmitForAnalysis,
    saveAnalysis
  } = useTechniqueAnalysis();

  const [streamlitUrl, setStreamlitUrl] = useState<string>("");
  const { user } = useAuth();

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
              <LogoHeader>Technique Analysis</LogoHeader>
              <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
                Upload a video of your technique for expert AI analysis and feedback
              </p>
              
              {!user && analysis && (
                <div className="mt-4 p-3 bg-black/30 border border-gray-700 rounded-lg inline-block">
                  <p className="text-white/90 mb-2">Sign in to save your analysis results</p>
                  <Button asChild variant="secondary" size="sm">
                    <Link to="/auth">
                      <UserIcon className="w-4 h-4 mr-2" />
                      Sign In
                    </Link>
                  </Button>
                </div>
              )}
            </div>
            
            <div className="max-w-5xl mx-auto">
              <Tabs defaultValue="gemini" className="mb-6">
                <TabsList className="bg-black/30 border border-gray-800">
                  <TabsTrigger value="gemini" className="data-[state=active]:bg-primary/20">Gemini Analysis</TabsTrigger>
                  <TabsTrigger value="streamlit" className="data-[state=active]:bg-primary/20">Streamlit Analysis</TabsTrigger>
                </TabsList>
                
                <TabsContent value="gemini">
                  <div className="rounded-lg overflow-hidden border border-gray-800 shadow-xl bg-black/40 p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <AnalysisForm
                        uploadedVideo={uploadedVideo}
                        setUploadedVideo={setUploadedVideo}
                        question={question}
                        setQuestion={setQuestion}
                        analysis={analysis}
                        setAnalysis={setAnalysis}
                        isLoading={isLoading}
                        isSaving={isSaving}
                        handleSubmitForAnalysis={handleSubmitForAnalysis}
                        handleReset={handleReset}
                        saveAnalysis={saveAnalysis}
                      />
                      
                      <AnalysisResults 
                        isLoading={isLoading}
                        analysis={analysis}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="streamlit">
                  <div className="rounded-lg overflow-hidden border border-gray-800 shadow-xl bg-black/40 p-6">
                    <div className="mb-4">
                      <StreamlitConfig 
                        streamlitUrl={streamlitUrl} 
                        setStreamlitUrl={setStreamlitUrl} 
                      />
                    </div>
                    
                    {streamlitUrl ? (
                      <StreamlitEmbed streamlitUrl={streamlitUrl} height="600px" />
                    ) : (
                      <div className="text-center py-12 border border-dashed border-gray-700 rounded-lg bg-black/20">
                        <h3 className="text-white mb-2 text-lg">No Streamlit App Connected</h3>
                        <p className="text-white/70 max-w-md mx-auto mb-4">
                          Configure a connection to your Streamlit application using the form above.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <AnalysisTips />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
