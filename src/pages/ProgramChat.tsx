
import { EnhancedChatContainer } from "@/components/chat/EnhancedChatContainer";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { spacing, width, text, layout } from "@/utils/responsive";
import { ProFeatureWrapper } from "@/components/common/ProFeatureWrapper";

export default function ProgramChat() {
  const header = (
    <div className={`${spacing.section} ${spacing.container} text-center ${layout.noOverflow}`}>
      <h1 className={`${text.title} font-bold text-primary`}>program.chat</h1>
      <p className={`${text.subtitle} text-foreground/80 ${width.content} mt-2`}>
        Your AI personal coach with complete access to your fitness data. Get personalized advice based on your actual workouts, nutrition, and wellness patterns.
      </p>
    </div>
  );

  return (
    <StandardPageLayout header={header} className="h-screen">
      <div className={`${width.full} ${layout.noOverflow} flex-1 min-h-0 ${spacing.container}`}>
        <ProFeatureWrapper featureName="Enhanced Program Chat">
          <EnhancedChatContainer />
        </ProFeatureWrapper>
      </div>
    </StandardPageLayout>
  );
}
