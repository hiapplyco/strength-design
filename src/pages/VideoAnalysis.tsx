import { VideoAnalysis as VideoAnalysisComponent } from "@/components/video-analysis/VideoAnalysis";

const VideoAnalysis = () => {
  return (
    <div className="min-h-screen bg-black pt-24 relative">
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
        <h2 className="text-4xl font-bold text-white mb-4">Coming Soon</h2>
        <p className="text-xl text-gray-300">We're working on making video analysis even better.</p>
      </div>
      
      {/* Greyed out content */}
      <div className="opacity-20 pointer-events-none">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Video Analysis</h1>
          <VideoAnalysisComponent />
        </div>
      </div>
    </div>
  );
};

export default VideoAnalysis;