import { CalendarDays, Share2, FileSpreadsheet, FileText, Copy, Download } from "lucide-react";
import { ActionButton } from "./ActionButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { marked } from 'marked';

interface HeaderActionsProps {
  onShare?: () => void;
  onExport: () => void;
  isExporting: boolean;
  workoutText: string;
  allWorkouts?: Record<string, { warmup: string; workout: string; notes?: string; strength: string; }>;
}

export function HeaderActions({
  onShare,
  onExport,
  isExporting,
  workoutText,
  allWorkouts,
}: HeaderActionsProps) {
  const { toast } = useToast();

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Success",
        description: "Workout copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy workout",
        variant: "destructive",
      });
    }
  };

  const formatWorkoutToMarkdown = (content: string) => {
    const lines = content.split('\n');
    let markdown = '';
    let currentSection = '';

    lines.forEach(line => {
      if (line.includes('Day:')) {
        markdown += `\n# ${line.trim()}\n\n`;
      } else if (line.includes('Strength:')) {
        currentSection = 'strength';
        markdown += `## 💪 Strength\n\n`;
      } else if (line.includes('Warmup:')) {
        currentSection = 'warmup';
        markdown += `## 🔥 Warm-up\n\n`;
      } else if (line.includes('Workout:')) {
        currentSection = 'workout';
        markdown += `## 🏋️‍♂️ Workout\n\n`;
      } else if (line.includes('Notes:')) {
        currentSection = 'notes';
        markdown += `## 📝 Notes\n\n`;
      } else if (line.trim() === '---') {
        markdown += `\n---\n\n`;
      } else if (line.trim()) {
        if (currentSection === 'workout') {
          const items = line.split(',').map(item => item.trim());
          items.forEach(item => {
            if (item) markdown += `- ${item}\n`;
          });
        } else {
          markdown += `${line.trim()}\n`;
        }
      }
    });

    return markdown;
  };

  const exportToExcel = async (content: string) => {
    try {
      const lines = content.split('\n');
      let csvContent = '';
      let currentSection = '';

      lines.forEach(line => {
        if (line.includes('Day:') || 
            line.includes('Strength:') || 
            line.includes('Warmup:') || 
            line.includes('Workout:') || 
            line.includes('Notes:')) {
          currentSection = line.trim();
          csvContent += `${currentSection}\n`;
        } else if (line.trim() && line.trim() !== '---') {
          csvContent += `${line.trim()}\n`;
        }
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'workout.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({
        title: "Success",
        description: "Workout exported to Excel format",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export workout to Excel",
        variant: "destructive",
      });
    }
  };

  const downloadWorkout = async (format: 'txt' | 'docx' | 'pdf') => {
    const content = allWorkouts ? formatAllWorkouts() : workoutText;
    const formattedContent = formatWorkoutToMarkdown(content);
    
    let blob: Blob;
    let filename: string;
    
    switch (format) {
      case 'txt':
        blob = new Blob([formattedContent], { type: 'text/plain;charset=utf-8' });
        filename = 'workout.txt';
        break;
      case 'docx':
        // Convert markdown to HTML for better Word compatibility
        const htmlContent = await marked(formattedContent);
        // Add basic Word document structure
        const wordDoc = `
          <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
          <head>
            <meta charset="utf-8">
            <title>Workout Plan</title>
          </head>
          <body>
            ${htmlContent}
          </body>
          </html>
        `;
        blob = new Blob([wordDoc], { type: 'application/vnd.ms-word;charset=utf-8' });
        filename = 'workout.docx';
        break;
      case 'pdf':
        // Convert markdown to HTML for PDF
        const pdfContent = await marked(formattedContent);
        // Create a styled HTML document for better PDF rendering
        const styledHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              h1 { color: #333; }
              h2 { color: #666; }
              ul { padding-left: 20px; }
            </style>
          </head>
          <body>
            ${pdfContent}
          </body>
          </html>
        `;
        blob = new Blob([styledHtml], { type: 'application/pdf' });
        filename = 'workout.pdf';
        break;
    }

    // Create download link and trigger download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    toast({
      title: "Success",
      description: `Workout downloaded as ${format.toUpperCase()}`,
    });
  };

  const formatAllWorkouts = () => {
    if (!allWorkouts) return '';
    return Object.entries(allWorkouts)
      .map(([day, workout]) => {
        const sections = [
          `Day: ${day}`,
          workout.strength && `Strength:\n${workout.strength}`,
          workout.warmup && `Warmup:\n${workout.warmup}`,
          workout.workout && `Workout:\n${workout.workout}`,
          workout.notes && `Notes:\n${workout.notes}`
        ].filter(Boolean);
        return sections.join('\n\n');
      })
      .join('\n\n---\n\n');
  };

  return (
    <div className="flex items-center gap-2">
      {onShare && <ActionButton icon={Share2} onClick={onShare} />}
      <ActionButton 
        icon={CalendarDays} 
        onClick={onExport}
        disabled={isExporting} 
      />
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
          <DropdownMenuItem onClick={() => downloadWorkout('txt')}>
            <FileText className="mr-2 h-4 w-4" />
            Download as TXT
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => downloadWorkout('docx')}>
            <FileText className="mr-2 h-4 w-4" />
            Download as DOCX
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => downloadWorkout('pdf')}>
            <FileText className="mr-2 h-4 w-4" />
            Download as PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ActionButton 
        icon={FileSpreadsheet} 
        onClick={() => exportToExcel(workoutText)}
      />
      <ActionButton 
        icon={Copy} 
        onClick={() => handleCopy(workoutText)}
      />
    </div>
  );
}