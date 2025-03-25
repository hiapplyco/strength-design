
import { VideoAnalysis } from "@/components/video-analysis/VideoAnalysis";
import { LogoHeader } from "@/components/ui/logo-header";

const VideoAnalysisPage = () => {
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="relative isolate">
        <main className="relative z-10 w-full">
          <div className="container mx-auto px-4 pt-20">
            <div className="text-center mb-8 md:mb-12">
              <LogoHeader>publish.program</LogoHeader>
              <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
                Create professional video content for your training programs. Our AI-powered teleprompter helps you deliver clear instructions.
              </p>
            </div>
            
            <VideoAnalysis />
          </div>
        </main>
      </div>
    </div>
  );
};

export default VideoAnalysisPage;
