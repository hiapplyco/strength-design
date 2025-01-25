import { Download, FileText } from "lucide-react";
import { ActionButton } from "./ActionButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DownloadButtonProps {
  onDownload: (format: 'txt' | 'pdf' | 'csv') => void;
}

export function DownloadButton({ onDownload }: DownloadButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>
          <ActionButton 
            icon={Download}
            onClick={() => {}}
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => onDownload('txt')}>
          <FileText className="mr-2 h-4 w-4" />
          Download as TXT
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDownload('csv')}>
          <FileText className="mr-2 h-4 w-4" />
          Download as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDownload('pdf')}>
          <FileText className="mr-2 h-4 w-4" />
          Download as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}