import { VideoAnalysis as VideoAnalysisComponent } from "@/components/video-analysis/VideoAnalysis";
import VideoRecorder from "@/components/video-analysis/VideoRecorder";

const VideoAnalysis = () => {
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed pt-24"
      style={{
        backgroundImage: 'url("/lovable-uploads/842b2afa-8591-4d83-b092-99399dbeaa94.png")',
      }}
    >
      <div className="min-h-screen bg-black/75 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">Video Analysis</h1>
          <div className="max-w-4xl mx-auto">
            <VideoRecorder />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAnalysis;