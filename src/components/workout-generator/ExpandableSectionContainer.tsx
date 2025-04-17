
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
          "flex items-center gap-3 cursor-pointer p-3 rounded-md relative",
          "dark:bg-black/20 light:bg-gray-100 dark:hover:bg-black/30 light:hover:bg-gray-200 transition-colors duration-200",
          "bg-gradient-to-r from-emerald-500/30 via-primary/5 to-purple-500/30"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-primary to-purple-500 opacity-10 rounded-md"></div>
        {icon}
        <h3 className="font-medium text-lg dark:text-white light:text-gray-800">{title}</h3>
        <TooltipWrapper content={tooltipContent} />
        <div className="ml-auto">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 dark:text-emerald-400 light:text-emerald-600" />
          ) : (
            <ChevronDown className="h-5 w-5 dark:text-emerald-400 light:text-emerald-600" />
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
            <div className="absolute inset-0 dark:bg-black/10 light:bg-gray-100 rounded-md"></div>
            <div className="absolute inset-0 rounded-md p-[1px] -z-10 bg-gradient-to-r from-emerald-500 via-primary to-purple-500 opacity-70"></div>
            
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
                    className="min-h-[100px] rounded-[20px] px-6 py-4 w-full text-black"
                    borderStyle="multicolor"
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
                  className="dark:hover:bg-red-500/10 light:hover:bg-red-100 dark:text-white light:text-gray-800"
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
