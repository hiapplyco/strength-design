import { VideoAnalysis as VideoAnalysisComponent } from "@/components/video-analysis/VideoAnalysis";

const VideoAnalysis = () => {
  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Video Analysis</h1>
        <VideoAnalysisComponent />
      </div>
    </div>
  );
};

export default VideoAnalysis;