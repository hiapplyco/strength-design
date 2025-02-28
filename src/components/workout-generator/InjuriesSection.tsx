
import { HeartPulse, X, ChevronDown, ChevronUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadSection } from "./FileUploadSection";
import { TooltipWrapper } from "./TooltipWrapper";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface InjuriesSectionProps {
  injuries: string;
  setInjuries: (value: string) => void;
  isAnalyzingInjuries: boolean;
  handleInjuriesFileSelect: (file: File) => Promise<void>;
}

export function InjuriesSection({
  injuries,
  setInjuries,
  isAnalyzingInjuries,
  handleInjuriesFileSelect
}: InjuriesSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleClear = () => {
    setInjuries("");
  };

  return (
    <div className="space-y-4">
      <div 
        className={cn(
          "flex items-center gap-3 cursor-pointer p-3 rounded-md relative",
          "hover:bg-black/30 transition-colors duration-200"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] opacity-10 rounded-md"></div>
        <HeartPulse className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg text-white">Any Injuries or Health Considerations?</h3>
        <TooltipWrapper content="Share any injuries, medical conditions, or movement limitations that may affect your workout" />
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
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 relative z-10">
              <div className="md:col-span-3">
                <Textarea
                  placeholder="List any injuries, medical conditions, or movement limitations"
                  value={injuries}
                  onChange={(e) => setInjuries(e.target.value)}
                  className="min-h-[100px] rounded-[20px] px-6 py-4 w-full text-black"
                  borderStyle="multicolor"
                />
              </div>
              <div className="md:col-span-1 min-w-[200px]">
                <FileUploadSection
                  title="Upload Medical Information"
                  isAnalyzing={isAnalyzingInjuries}
                  content={injuries}
                  onFileSelect={handleInjuriesFileSelect}
                  analysisSteps={["Processing file", "Extracting information", "Analyzing content"]}
                />
              </div>
            </div>

            {injuries && (
              <div className="flex justify-end mt-2 relative z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
