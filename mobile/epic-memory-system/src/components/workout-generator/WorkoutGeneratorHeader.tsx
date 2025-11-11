
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
        <Dumbbell className="h-10 w-10 text-primary mr-3" />
        <LogoHeader>generate.workout</LogoHeader>
      </div>
      
      <motion.p 
        className="text-xl text-muted-foreground max-w-3xl mx-auto px-2"
        variants={itemVariants}
      >
        Create personalized workout programs tailored to your needs. Our machine learned models considers your fitness level, available equipment, and specific requirements.
      </motion.p>
      
      <motion.div 
        className="flex items-center justify-center mt-6 text-muted-foreground text-sm"
        variants={itemVariants}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center cursor-help">
                <Info className="h-4 w-4 mr-2 text-primary" />
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
