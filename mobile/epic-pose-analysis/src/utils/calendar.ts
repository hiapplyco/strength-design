import { createEvents } from 'ics';
import { sanitizeText } from "@/utils/text";
import { useToast } from "@/hooks/use-toast";

export const exportToCalendar = async (
  events: Array<{
    title: string;
    warmup: string;
    workout: string;
    notes: string;
    dayOffset: number;
  }>,
  toast?: ReturnType<typeof useToast>["toast"]
) => {
  try {
    const calendarEvents = events.map(({ title, warmup, workout, notes, dayOffset }) => {
      const eventContent = `Warmup:\n${sanitizeText(warmup)}\n\nWorkout:\n${sanitizeText(workout)}\n\nNotes:\n${sanitizeText(notes)}`;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1 + dayOffset);
      startDate.setHours(6, 0, 0, 0);
      
      return {
        start: [
          startDate.getFullYear(),
          startDate.getMonth() + 1,
          startDate.getDate(),
          startDate.getHours(),
          startDate.getMinutes()
        ] as [number, number, number, number, number],
        duration: { hours: 1 },
        title: `${sanitizeText(title)} Workout`,
        description: eventContent,
        location: '',
        status: 'CONFIRMED' as const,
        busyStatus: 'BUSY' as const
      };
    });

    return new Promise((resolve, reject) => {
      createEvents(calendarEvents, (error: Error | undefined, value: string) => {
        if (error) {
          console.error(error);
          toast?.({
            title: "Error",
            description: "Failed to create calendar events",
            variant: "destructive",
          });
          reject(error);
          return;
        }

        const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `workout-plan.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast?.({
          title: "Success",
          description: "Calendar events have been downloaded",
        });
        resolve(value);
      });
    });
  } catch (error) {
    console.error('Error exporting calendar:', error);
    toast?.({
      title: "Error",
      description: "Failed to export calendar events",
      variant: "destructive",
    });
    throw error;
  }
};