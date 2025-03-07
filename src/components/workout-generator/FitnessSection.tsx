
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
          "flex items-center gap-3 cursor-pointer p-3 rounded-md relative",
          "bg-black/20 hover:bg-black/30 transition-colors duration-200",
          "bg-gradient-to-r from-[#0e401a]/30 via-[#3b0f47]/30 to-[#4a0924]/30"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-10 rounded-md"></div>
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg text-white">Your Fitness Level</h3>
        {renderTooltip ? renderTooltip() : (
          <TooltipWrapper content="Select your fitness level to customize workout intensity" />
        )}
        <div className="ml-auto">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-primary" />
          ) : (
            <ChevronDown className="h-5 w-5 text-primary" />
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
            className="overflow-hidden relative rounded-md p-4 pl-6"
          >
            <div className="absolute inset-0 bg-black/10 rounded-md"></div>
            <div className="absolute inset-0 rounded-md p-[1px] -z-10 bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-70"></div>
            
            <div className="relative z-10 pt-2">
              <Select 
                value={fitnessLevel} 
                onValueChange={onFitnessLevelChange}
              >
                <SelectTrigger className="w-full bg-white text-black rounded-[20px] border-none h-[50px]">
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
