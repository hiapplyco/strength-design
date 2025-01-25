import { marked } from 'marked';
import { toast } from "@/hooks/use-toast";
import { formatWorkoutToMarkdown } from './workout-formatting';
import { jsPDF } from 'jspdf';

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

export const downloadWorkout = async (format: 'txt' | 'pdf' | 'csv', content: string) => {
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
      case 'pdf':
        const doc = new jsPDF();
        
        // Split content into sections
        const sections = formattedContent.split('\n\n');
        let yOffset = 20;
        
        sections.forEach((section, index) => {
          if (yOffset > 270) { // Check if we need a new page
            doc.addPage();
            yOffset = 20;
          }
          
          if (section.startsWith('#')) {
            // It's a heading
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text(section.replace('#', '').trim(), 20, yOffset);
            yOffset += 10;
          } else if (section.startsWith('##')) {
            // It's a subheading
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(section.replace('##', '').trim(), 20, yOffset);
            yOffset += 8;
          } else {
            // Regular text
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            
            // Split long text into multiple lines
            const lines = doc.splitTextToSize(section, 170);
            lines.forEach(line => {
              if (yOffset > 270) {
                doc.addPage();
                yOffset = 20;
              }
              doc.text(line, 20, yOffset);
              yOffset += 7;
            });
          }
          
          yOffset += 10; // Add space between sections
        });
        
        blob = new Blob([doc.output('blob')], { type: 'application/pdf' });
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