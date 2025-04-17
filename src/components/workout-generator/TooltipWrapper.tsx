
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TooltipWrapperProps {
  content: string;
  icon?: React.ReactNode;
}

export function TooltipWrapper({ content, icon }: TooltipWrapperProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-help flex items-center">
            {icon || <Info className="h-4 w-4 text-emerald-400" />}
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-900/90 border border-emerald-500/30 text-white max-w-xs">
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
