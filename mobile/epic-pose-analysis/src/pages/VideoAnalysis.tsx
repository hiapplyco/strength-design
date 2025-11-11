
import { VideoAnalysis } from "@/components/video-analysis/VideoAnalysis";
import { LogoHeader } from "@/components/ui/logo-header";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { spacing, width, text, layout } from "@/utils/responsive";

const VideoAnalysisPage = () => {
  return (
    <StandardPageLayout className={spacing.container}>
      <div className={`${width.narrow} ${spacing.section} text-center`}>
        <LogoHeader className={text.title}>publish.program</LogoHeader>
        <p className={`${text.subtitle} text-foreground/80 mt-2`}>
          Create professional video content for your training programs. Our AI-powered teleprompter helps you deliver clear instructions.
        </p>
      </div>
      
      <div className={`${width.content} ${layout.noOverflow}`}>
        <VideoAnalysis />
      </div>
    </StandardPageLayout>
  );
};

export default VideoAnalysisPage;
