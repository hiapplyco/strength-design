
import { ModernWorkoutGenerator } from "@/components/workout-generator/modern/ModernWorkoutGenerator";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { WorkoutConfigProvider } from "@/contexts/WorkoutConfigContext";
import { spacing, width } from "@/utils/responsive";

export default function WorkoutGenerator() {
  return (
    <StandardPageLayout className={spacing.container}>
      <div className={`${width.full} ${spacing.section}`}>
        <WorkoutConfigProvider>
          <ModernWorkoutGenerator />
        </WorkoutConfigProvider>
      </div>
    </StandardPageLayout>
  );
}
