import { VideoAnalysis } from "@/components/video-analysis/VideoAnalysis";
import { LogoHeader } from "@/components/ui/logo-header";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";

const VideoAnalysisPage = () => {
  return (
    <StandardPageLayout
      header={
        <div className="text-center mb-8">
          <LogoHeader>publish.program</LogoHeader>
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto">
            Create professional video content for your training programs. Our AI-powered teleprompter helps you deliver clear instructions.
          </p>
        </div>
      }
    >
      <div className="flex flex-1 w-full max-w-3xl mx-auto flex-col">
        <VideoAnalysis />
      </div>
    </StandardPageLayout>
  );
};

export default VideoAnalysisPage;
