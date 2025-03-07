
import { AnalysisForm } from "./AnalysisForm";
import { AnalysisResults } from "./AnalysisResults";
import { AnalysisTips } from "./AnalysisTips";
import { LogoHeader } from "@/components/ui/logo-header";
import { useTechniqueAnalysis } from "@/hooks/useTechniqueAnalysis";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserIcon } from "lucide-react";

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
            
            <div className="max-w-4xl mx-auto rounded-lg overflow-hidden border border-gray-800 shadow-xl bg-black/40 p-6">
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

            <AnalysisTips />
          </div>
        </main>
      </div>
    </div>
  );
};
