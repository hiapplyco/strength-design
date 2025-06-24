
import { ModernWorkoutForm } from "./ModernWorkoutForm";
import { ModernWorkoutSidebar } from "./ModernWorkoutSidebar";
import { FreeGenerationsBanner } from "../FreeGenerationsBanner";
import { useWorkoutConfig } from "@/contexts/WorkoutConfigContext";
import { useTheme } from "@/contexts/ThemeContext";

export const ModernWorkoutGenerator = () => {
  const { getConfigCompleteness } = useWorkoutConfig();
  const { theme } = useTheme();
  const { level } = getConfigCompleteness();
  
  // Calculate background opacity based on completeness level (0-6)
  const getBackgroundClass = () => {
    const baseClass = "min-h-screen transition-all duration-500 ease-in-out";
    
    if (theme === 'dark') {
      // Dark mode: lighter as more complete
      const opacities = [
        'bg-background', // 0/6 - darkest
        'bg-background/95', // 1/6
        'bg-background/90', // 2/6  
        'bg-background/85', // 3/6
        'bg-background/80', // 4/6
        'bg-background/75', // 5/6
        'bg-background/70'  // 6/6 - lightest
      ];
      return `${baseClass} ${opacities[level]}`;
    } else {
      // Light mode: darker as more complete
      const opacities = [
        'bg-background', // 0/6 - lightest
        'bg-primary/5',   // 1/6
        'bg-primary/10',  // 2/6
        'bg-primary/15',  // 3/6
        'bg-primary/20',  // 4/6
        'bg-primary/25',  // 5/6
        'bg-primary/30'   // 6/6 - darkest
      ];
      return `${baseClass} ${opacities[level]}`;
    }
  };

  return (
    <div className={getBackgroundClass()}>
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
  );
};
