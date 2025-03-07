
import { motion } from "framer-motion";
import { Dumbbell, Info } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { itemVariants } from "./animations";

export function WorkoutGeneratorHeader() {
  return (
    <motion.div 
      className="text-center mb-12 max-w-full overflow-hidden px-2"
      variants={itemVariants}
    >
      <div className="flex items-center justify-center mb-6">
        <Dumbbell className="h-10 w-10 text-destructive mr-3 animate-pulse" />
        <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-oswald text-destructive dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-md px-2 sm:px-4 py-3 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] inline-block bg-black mb-0 max-w-full break-words">
          generate.workout
        </h1>
      </div>
      
      <motion.p 
        className="text-xl text-white/80 max-w-3xl mx-auto px-2"
        variants={itemVariants}
      >
        Create personalized workout programs tailored to your needs. Our machine learned models considers your fitness level, available equipment, and specific requirements.
      </motion.p>
      
      <motion.div 
        className="flex items-center justify-center mt-6 text-white/60 text-sm"
        variants={itemVariants}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center cursor-help">
                <Info className="h-4 w-4 mr-2" />
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
