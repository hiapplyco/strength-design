import { marked } from 'marked';
import { toast } from "@/hooks/use-toast";
import { formatWorkoutToMarkdown } from './workout-formatting';

export const exportToExcel = (content: string) => {
  try {
    const csvContent = content.split('\n')
      .map(line => line.trim())
      .filter(line => line && line !== '---')
      .join(',');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'workout.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);

    toast({
      title: "Success",
      description: "Workout exported as CSV",
    });
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    toast({
      title: "Error",
      description: "Failed to export workout as CSV",
      variant: "destructive",
    });
  }
};

export const downloadWorkout = async (format: 'txt' | 'docx' | 'pdf' | 'csv', content: string) => {
  try {
    const formattedContent = formatWorkoutToMarkdown(content);
    let blob: Blob;
    let filename: string;
    
    switch (format) {
      case 'txt':
        blob = new Blob([formattedContent], { type: 'text/plain;charset=utf-8' });
        filename = 'workout.txt';
        break;
      case 'csv':
        const csvContent = content.split('\n')
          .map(line => line.trim())
          .filter(line => line && line !== '---')
          .join(',');
        blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        filename = 'workout.csv';
        break;
      case 'docx':
        const htmlContent = marked(formattedContent);
        const docContent = `
          <!DOCTYPE html>
          <html xmlns:w="urn:schemas-microsoft-com:office:word">
          <head>
            <meta charset="utf-8">
            <title>Workout Plan</title>
            <style>
              body { font-family: Arial, sans-serif; }
              h1 { color: #333; }
              h2 { color: #666; }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
          </html>
        `;
        blob = new Blob([docContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        filename = 'workout.docx';
        break;
      case 'pdf':
        const pdfContent = marked(formattedContent);
        const styledHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                line-height: 1.6; 
                margin: 2cm;
              }
              h1 { color: #333; margin-top: 1em; }
              h2 { color: #666; margin-top: 0.8em; }
              ul { padding-left: 20px; }
              p { margin: 0.5em 0; }
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
      default:
        throw new Error('Unsupported format');
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
  } catch (error) {
    console.error('Error downloading workout:', error);
    toast({
      title: "Error",
      description: `Failed to download workout as ${format.toUpperCase()}`,
      variant: "destructive",
    });
  }
};