
import { MovementAnalysisContent } from "@/components/movement-analysis/MovementAnalysisContent";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { spacing, width, layout } from "@/utils/responsive";
import { ProFeatureWrapper } from "@/components/common/ProFeatureWrapper";

export default function MovementAnalysisPage() {
  return (
    <StandardPageLayout className={spacing.container}>
      <div className={`${width.full} ${layout.noOverflow} ${spacing.section}`}>
        <ProFeatureWrapper featureName="Movement Analysis">
          <MovementAnalysisContent />
        </ProFeatureWrapper>
      </div>
    </StandardPageLayout>
  );
}
