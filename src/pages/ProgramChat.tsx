
import { EnhancedChatContainer } from "@/components/chat/EnhancedChatContainer";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { spacing, typography } from "@/lib/design-tokens";
import { ProFeatureWrapper } from "@/components/common/ProFeatureWrapper";
import { cn } from "@/lib/utils";

export default function ProgramChat() {
  const header = (
    <div className={cn(spacing.section.default, "text-center")}>
      <h1 className={cn(typography.display.h3, "font-bold text-primary")}>program.chat</h1>
      <p className={cn(typography.body.default, "text-muted-foreground max-w-4xl mx-auto mt-2")}>
        Your AI personal coach with complete access to your fitness data. Get personalized advice based on your actual workouts, nutrition, and wellness patterns.
      </p>
    </div>
  );

  return (
    <StandardPageLayout header={header} className="h-screen">
      <div className="w-full flex-1 min-h-0 px-2 sm:px-4">
        <ProFeatureWrapper featureName="Enhanced Program Chat">
          <EnhancedChatContainer />
        </ProFeatureWrapper>
      </div>
    </StandardPageLayout>
  );
}
