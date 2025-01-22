import { createEvents } from 'ics';
import { sanitizeText } from "@/utils/text";
import { useToast } from "@/hooks/use-toast";

export const exportToCalendar = async (
  title: string,
  warmup: string,
  workout: string,
  notes: string,
  toast: ReturnType<typeof useToast>["toast"],
  dayOffset: number = 0
) => {
  try {
    const eventContent = `Warmup:\n${sanitizeText(warmup)}\n\nWorkout:\n${sanitizeText(workout)}\n\nNotes:\n${sanitizeText(notes)}`;
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1 + dayOffset);
    tomorrow.setHours(6, 0, 0, 0);
    
    const event = {
      start: [
        tomorrow.getFullYear(),
        tomorrow.getMonth() + 1,
        tomorrow.getDate(),
        tomorrow.getHours(),
        tomorrow.getMinutes()
      ] as [number, number, number, number, number],
      duration: { hours: 1 },
      title: `${sanitizeText(title)} Workout`,
      description: eventContent,
      location: '',
      status: 'CONFIRMED' as const,
      busyStatus: 'BUSY' as const
    };

    return new Promise((resolve, reject) => {
      createEvents([event], (error: Error | undefined, value: string) => {
        if (error) {
          console.error(error);
          toast({
            title: "Error",
            description: "Failed to create calendar event",
            variant: "destructive",
          });
          reject(error);
          return;
        }

        const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `${title.toLowerCase()}-workout.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Success",
          description: "Calendar event has been downloaded",
        });
        resolve(value);
      });
    });
  } catch (error) {
    console.error('Error exporting calendar:', error);
    toast({
      title: "Error",
      description: "Failed to export calendar event",
      variant: "destructive",
    });
    throw error;
  }
};