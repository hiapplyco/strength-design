
import { VideoAnalysis } from "@/components/video-analysis/VideoAnalysis";
import { LogoHeader } from "@/components/ui/logo-header";
import { StyledLogo } from "@/components/ui/styled-logo";

const VideoAnalysisPage = () => {
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
              <StyledLogo size="large" className="mb-4" />
              <LogoHeader>publish.program</LogoHeader>
              <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
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
