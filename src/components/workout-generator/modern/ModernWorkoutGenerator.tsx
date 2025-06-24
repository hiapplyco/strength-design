
import { ModernWorkoutForm } from "./ModernWorkoutForm";
import { ModernWorkoutSidebar } from "./ModernWorkoutSidebar";
import { FreeGenerationsBanner } from "../FreeGenerationsBanner";
import { WorkoutConfigProvider } from "@/contexts/WorkoutConfigContext";

export const ModernWorkoutGenerator = () => {
  return (
    <WorkoutConfigProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <FreeGenerationsBanner />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <ModernWorkoutForm />
            </div>
            <div className="lg:col-span-4">
              <ModernWorkoutSidebar />
            </div>
          </div>
        </div>
      </div>
    </WorkoutConfigProvider>
  );
};
