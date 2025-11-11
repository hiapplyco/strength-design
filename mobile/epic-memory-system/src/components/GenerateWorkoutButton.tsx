import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { colors, animations } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

interface GenerateWorkoutButtonProps {
  setShowGenerateInput: (value: boolean) => void;
  isGenerating?: boolean;
}

export function GenerateWorkoutButton({ setShowGenerateInput, isGenerating }: GenerateWorkoutButtonProps) {
  return (
    <motion.div
      {...animations.hover}
      {...animations.tap}
    >
      <Button 
        onClick={() => setShowGenerateInput(true)}
        disabled={isGenerating}
        className={cn(
          "text-black font-collegiate text-xl uppercase tracking-tight",
          "transition-all transform hover:-translate-y-1 hover:shadow-lg",
          "px-8 py-6 rounded-[20px]",
          isGenerating && "opacity-75"
        )}
        style={{
          backgroundColor: colors.hex.gold,
          borderColor: colors.hex.gold,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.hex.goldLight;
          e.currentTarget.style.borderColor = colors.hex.goldLight;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.hex.gold;
          e.currentTarget.style.borderColor = colors.hex.gold;
        }}
      >
        {isGenerating ? (
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        ) : (
          <Plus className="mr-2 h-6 w-6" />
        )}
        {isGenerating ? 'Generating...' : 'Generate Free Workout'}
      </Button>
    </motion.div>
  );
}