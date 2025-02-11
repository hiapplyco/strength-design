
import { VideoAnalysis } from "@/components/video-analysis/VideoAnalysis";

const VideoAnalysisPage = () => {
  return (
    <div className="min-h-screen w-full">
      <div className="relative isolate">
        {/* Background image with optimized loading */}
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
        
        {/* Main content */}
        <main className="relative z-10 w-full">
          <div className="container mx-auto px-4 pt-20">
            <div className="text-center mb-8 md:mb-12">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-lg px-3 py-2 md:px-4 md:py-3 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] inline-block bg-black mb-4">
                publish.program
              </h1>
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
