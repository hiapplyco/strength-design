import { marked } from 'marked';
import { toast } from "@/hooks/use-toast";

export const exportToExcel = async (content: string) => {
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

export const downloadWorkout = async (format: 'txt' | 'docx' | 'pdf', content: string) => {
  const formattedContent = formatWorkoutToMarkdown(content);
  
  let blob: Blob;
  let filename: string;
  
  switch (format) {
    case 'txt':
      blob = new Blob([formattedContent], { type: 'text/plain;charset=utf-8' });
      filename = 'workout.txt';
      break;
    case 'docx':
      const htmlContent = await marked(formattedContent);
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
      const pdfContent = await marked(formattedContent);
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