
import { NutritionDiaryContent } from "@/components/nutrition-diary/NutritionDiaryContent";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { spacing, width, layout } from "@/utils/responsive";
import { ProFeatureWrapper } from "@/components/common/ProFeatureWrapper";

export default function NutritionDiary() {
  return (
    <StandardPageLayout className={spacing.container}>
      <div className={`${width.full} ${layout.noOverflow} ${spacing.section}`}>
        <ProFeatureWrapper featureName="Nutrition Diary & Tracking">
          <NutritionDiaryContent />
        </ProFeatureWrapper>
      </div>
    </StandardPageLayout>
  );
}
