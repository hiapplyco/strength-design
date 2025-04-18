
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FileUploadSection } from "./FileUploadSection";
import { TooltipWrapper } from "./TooltipWrapper";
import { Button } from "@/components/ui/button";
import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ExpandableSectionContainerProps {
  icon: ReactNode;
  title: string;
  tooltipContent: string;
  textAreaPlaceholder: string;
  fileUploadTitle: string;
  fileAnalysisSteps: string[];
  content: string;
  setContent: (value: string) => void;
  isAnalyzing: boolean;
  handleFileSelect: (file: File) => Promise<void>;
  initialExpanded?: boolean;
  renderCustomContent?: () => ReactNode;
}

export function ExpandableSectionContainer({
  icon,
  title,
  tooltipContent,
  textAreaPlaceholder,
  fileUploadTitle,
  fileAnalysisSteps,
  content,
  setContent,
  isAnalyzing,
  handleFileSelect,
  initialExpanded = false,
  renderCustomContent
}: ExpandableSectionContainerProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  
  const handleClear = () => {
    setContent("");
  };

  return (
    <div className="space-y-4">
      <div 
        className={cn(
          "flex items-center gap-3 cursor-pointer p-3 rounded-md",
          "bg-card hover:bg-card/80 transition-colors duration-200"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {icon}
        <h3 className="font-medium text-lg">{title}</h3>
        <TooltipWrapper content={tooltipContent} />
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
            {renderCustomContent ? (
              <div className="relative z-10 pt-2">
                {renderCustomContent()}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2 relative z-10">
                <div className="md:col-span-4">
                  <Textarea
                    placeholder={textAreaPlaceholder}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[100px] rounded-md px-6 py-4 w-full"
                  />
                </div>
                <div className="md:col-span-1">
                  <FileUploadSection
                    title={fileUploadTitle}
                    isAnalyzing={isAnalyzing}
                    content={content}
                    onFileSelect={handleFileSelect}
                    analysisSteps={fileAnalysisSteps}
                  />
                </div>
              </div>
            )}

            {content && !renderCustomContent && (
              <div className="flex justify-end mt-2 relative z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
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
