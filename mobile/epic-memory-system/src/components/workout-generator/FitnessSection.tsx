
import { useState } from "react";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";
import { TooltipWrapper } from "./TooltipWrapper";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FitnessSectionProps {
  fitnessLevel: string;
  onFitnessLevelChange: (value: string) => void;
  renderTooltip: () => React.ReactNode;
}

export function FitnessSection({ 
  fitnessLevel, 
  onFitnessLevelChange,
  renderTooltip
}: FitnessSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const fitnessLevels = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
    { value: "elite", label: "Elite" },
  ];

  return (
    <div className="space-y-4">
      <div 
        className={cn(
          "flex items-center gap-3 cursor-pointer p-3 rounded-md",
          "bg-card hover:bg-card/80 transition-colors duration-200"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="font-medium text-lg">Your Fitness Level</h3>
        {renderTooltip ? renderTooltip() : (
          <TooltipWrapper content="Select your fitness level to customize workout intensity" />
        )}
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
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden rounded-md p-4 pl-6 bg-card/50"
          >            
            <div className="relative z-10 pt-2">
              <Select 
                value={fitnessLevel} 
                onValueChange={onFitnessLevelChange}
              >
                <SelectTrigger className="w-full rounded-md border h-[50px]">
                  <SelectValue placeholder="Select your fitness level" />
                </SelectTrigger>
                <SelectContent>
                  {fitnessLevels.map((level) => (
                    <SelectItem 
                      key={level.value} 
                      value={level.value}
                      className="cursor-pointer"
                    >
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
