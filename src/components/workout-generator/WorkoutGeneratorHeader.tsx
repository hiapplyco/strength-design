
import { motion } from "framer-motion";
import { Dumbbell, Info } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { itemVariants } from "./animations";
import { LogoHeader } from "@/components/ui/logo-header";

export function WorkoutGeneratorHeader() {
  return (
    <motion.div 
      className="text-center mb-12 max-w-full overflow-hidden px-2"
      variants={itemVariants}
    >
      <div className="flex items-center justify-center mb-6">
        <Dumbbell className="h-10 w-10 dark:text-emerald-400 light:text-emerald-600 mr-3 animate-pulse" />
        <LogoHeader className="dark:text-white light:text-gray-800">generate.workout</LogoHeader>
      </div>
      
      <motion.p 
        className="text-xl dark:text-white/80 light:text-gray-700 max-w-3xl mx-auto px-2"
        variants={itemVariants}
      >
        Create personalized workout programs tailored to your needs. Our machine learned models considers your fitness level, available equipment, and specific requirements.
      </motion.p>
      
      <motion.div 
        className="flex items-center justify-center mt-6 dark:text-white/60 light:text-gray-600 text-sm"
        variants={itemVariants}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center cursor-help">
                <Info className="h-4 w-4 mr-2 dark:text-emerald-400 light:text-emerald-600" />
                <span>Program generation typically takes about 30 seconds</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">Our AI generates detailed, personalized workout plans based on your inputs. The process involves complex calculations to ensure optimal training balance.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
    </motion.div>
  );
}
