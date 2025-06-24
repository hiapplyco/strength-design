
import { Activity, User, Dumbbell, BicepsFlexed, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TooltipWrapper } from "./TooltipWrapper";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { spacing, animations } from "@/lib/design-tokens";

interface FitnessLevelSectionProps {
  fitnessLevel: string;
  setFitnessLevel: (value: string) => void;
}

const fitnessLevels = [
  { level: "beginner", label: "Beginner", icon: User },
  { level: "intermediate", label: "Intermediate", icon: Dumbbell },
  { level: "advanced", label: "Advanced", icon: Activity },
  { level: "elite", label: "Elite", icon: BicepsFlexed },
];

export function FitnessLevelSection({
  fitnessLevel,
  setFitnessLevel,
}: FitnessLevelSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={spacing.gap.md}>
      <div 
        className={cn(
          "flex items-center gap-3 cursor-pointer p-4 rounded-md",
          "bg-card hover:bg-card/80 transition-colors duration-200",
          "border border-border/50"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Activity className="h-5 w-5 text-primary flex-shrink-0" />
        <h3 className="font-medium text-lg flex-1">What are your fitness goals?</h3>
        <TooltipWrapper content="Select your fitness level to receive appropriately challenging workouts" />
        <div className="ml-auto">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={animations.slideUp.initial}
            animate={animations.slideUp.animate}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <Card variant="flat" className={cn(spacing.component.md, "ml-8")}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {fitnessLevels.map(({ level, label, icon: Icon }) => (
                  <Button
                    key={level}
                    onClick={() => setFitnessLevel(level)}
                    variant={fitnessLevel === level ? "default" : "outline"}
                    className={cn(
                      "w-full transition-all duration-200 flex items-center gap-2 justify-center",
                      fitnessLevel === level 
                        ? "text-white" 
                        : "bg-black/50 text-white hover:bg-black/70 border gradient-border"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="capitalize">{label}</span>
                  </Button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
