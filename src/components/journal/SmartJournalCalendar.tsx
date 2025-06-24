
import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer, Event } from "react-big-calendar";
import withDragAndDrop, { withDragAndDropProps } from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay, startOfDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import { useWorkoutSessions, WorkoutSessionWithGeneratedWorkout } from "@/hooks/useWorkoutSessions";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { Database } from "@/integrations/supabase/types";
import { Dumbbell, Heart } from "lucide-react";
import { DailyWorkoutDetailModal } from "./DailyWorkoutDetailModal";

import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

type JournalEntry = Database['public']['Tables']['journal_entries']['Row'];

interface CalendarEvent {
  id?: string | number;
  title?: React.ReactNode;
  start?: Date;
  end?: Date;
  allDay?: boolean;
  resource?: any;
  type: 'workout' | 'journal';
  sessionId?: string;
  entryId?: string;
  status?: string;
  data?: WorkoutSessionWithGeneratedWorkout | JournalEntry;
}

export const SmartJournalCalendar = () => {
  const { sessions, updateSession } = useWorkoutSessions();
  const { entries } = useJournalEntries();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedWorkoutSession, setSelectedWorkoutSession] = useState<WorkoutSessionWithGeneratedWorkout | undefined>();

  useEffect(() => {
    const calendarEvents: CalendarEvent[] = [];

    sessions.forEach(session => {
      const startOfDayDate = startOfDay(new Date(session.scheduled_date + 'T00:00:00'));
      const endDate = new Date(startOfDayDate);
      endDate.setHours(startOfDayDate.getHours() + 1);

      calendarEvents.push({
        id: session.id,
        title: `${session.generated_workouts?.title || 'Training Session'}`,
        start: startOfDayDate,
        end: endDate,
        type: 'workout',
        sessionId: session.id,
        status: session.status,
        data: session,
        resource: {
          type: 'workout',
          status: session.status,
          id: session.id
        }
      });
    });

    entries.forEach(entry => {
      const startOfDayDate = startOfDay(new Date(entry.date + 'T00:00:00'));
      const endDate = new Date(startOfDayDate);
      endDate.setHours(23, 59, 59);

      calendarEvents.push({
        id: entry.id,
        title: entry.title || 'Journal Entry',
        start: startOfDayDate,
        end: endDate,
        allDay: true,
        type: 'journal',
        entryId: entry.id,
        data: entry,
        resource: {
          type: 'journal',
          id: entry.id
        }
      });
    });

    setEvents(calendarEvents);
  }, [sessions, entries]);

  const onEventResize: withDragAndDropProps['onEventResize'] = async ({ event, start, end }) => {
    if (event.type === 'workout' && event.sessionId) {
      const newDate = format(new Date(start), 'yyyy-MM-dd');
      await updateSession(event.sessionId, { scheduled_date: newDate });
    }

    setEvents(currentEvents => {
      return currentEvents.map(evt =>
        evt.id === event.id ? { ...evt, start: new Date(start), end: new Date(end) } : evt
      );
    });
  };

  const onEventDrop: withDragAndDropProps['onEventDrop'] = async ({ event, start }) => {
    if (event.type === 'workout' && event.sessionId) {
      const newDate = format(new Date(start), 'yyyy-MM-dd');
      await updateSession(event.sessionId, { scheduled_date: newDate });
    }

    setEvents(currentEvents => {
      return currentEvents.map(evt => {
        if (evt.id === event.id) {
          const duration = evt.end && evt.start ? evt.end.getTime() - evt.start.getTime() : 3600 * 1000;
          return { ...evt, start: new Date(start), end: new Date(new Date(start).getTime() + duration) };
        }
        return evt;
      });
    });
  };

  const onSelectEvent = (event: CalendarEvent) => {
    if (event.type === 'workout' && event.data) {
      setSelectedWorkoutSession(event.data as WorkoutSessionWithGeneratedWorkout);
      setSelectedDate(event.start || new Date());
    } else if (event.type === 'journal') {
      setSelectedDate(event.start || new Date());
      setSelectedWorkoutSession(undefined);
    }
  };

  const onSelectSlot = ({ start }: { start: Date }) => {
    const workoutSession = sessions.find(session => 
      format(new Date(session.scheduled_date), 'yyyy-MM-dd') === format(start, 'yyyy-MM-dd')
    );
    
    setSelectedDate(start);
    setSelectedWorkoutSession(workoutSession);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3174ad';
    let borderColor = '#3174ad';

    if (event.type === 'workout') {
      switch (event.status) {
        case 'completed':
          backgroundColor = '#22c55e';
          borderColor = '#16a34a';
          break;
        case 'in_progress':
          backgroundColor = '#f59e0b';
          borderColor = '#d97706';
          break;
        case 'skipped':
          backgroundColor = '#ef4444';
          borderColor = '#dc2626';
          break;
        default:
          backgroundColor = '#3b82f6';
          borderColor = '#2563eb';
      }
    } else if (event.type === 'journal') {
      backgroundColor = '#8b5cf6';
      borderColor = '#7c3aed';
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color: 'white',
        border: `2px solid ${borderColor}`,
        borderRadius: '6px',
        fontSize: '12px',
        padding: '2px 6px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
    };
  };

  const CustomEvent = ({ event }: { event: CalendarEvent }) => {
    const getIcon = () => {
      if (event.type === 'workout') {
        return <Dumbbell className="h-3 w-3 mr-1 flex-shrink-0" />;
      }
      return <Heart className="h-3 w-3 mr-1 flex-shrink-0" />;
    };

    return (
      <div className="flex items-center text-xs overflow-hidden">
        {getIcon()}
        <span className="truncate">{String(event.title)}</span>
      </div>
    );
  };

  return (
    <>
      <div className="h-[600px] bg-background rounded-lg border shadow-sm">
        <div className="p-4 border-b bg-card">
          <h3 className="text-lg font-semibold mb-2">Fitness Calendar</h3>
          <div className="flex gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Scheduled Workouts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span>Journal Entries</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>In Progress</span>
            </div>
          </div>
        </div>
        <div className="p-4" style={{ height: 'calc(100% - 120px)' }}>
          <DnDCalendar
            defaultView="week"
            events={events}
            localizer={localizer}
            onEventDrop={onEventDrop}
            onEventResize={onEventResize}
            onSelectEvent={onSelectEvent}
            onSelectSlot={onSelectSlot}
            selectable
            resizable
            eventPropGetter={eventStyleGetter}
            components={{
              event: CustomEvent
            }}
            style={{ height: "100%" }}
            views={['month', 'week', 'day']}
            step={60}
            showMultiDayTimes
            dayLayoutAlgorithm="no-overlap"
            className="rbc-calendar-custom"
          />
        </div>
      </div>

      {selectedDate && (
        <DailyWorkoutDetailModal
          open={!!selectedDate}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedDate(null);
              setSelectedWorkoutSession(undefined);
            }
          }}
          date={selectedDate}
          workoutSession={selectedWorkoutSession}
        />
      )}

      <style>{`
        .rbc-calendar-custom {
          font-family: inherit;
        }
        
        .rbc-calendar-custom .rbc-time-view .rbc-time-gutter,
        .rbc-calendar-custom .rbc-time-view .rbc-time-content {
          border-color: hsl(var(--border));
        }
        
        .rbc-calendar-custom .rbc-time-view .rbc-timeslot-group {
          border-bottom: 1px solid hsl(var(--border));
        }
        
        .rbc-calendar-custom .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid hsl(var(--border));
        }
        
        .rbc-calendar-custom .rbc-month-view,
        .rbc-calendar-custom .rbc-time-header {
          border-color: hsl(var(--border));
        }
        
        .rbc-calendar-custom .rbc-header {
          border-bottom: 1px solid hsl(var(--border));
          background-color: hsl(var(--muted));
          color: hsl(var(--foreground));
          padding: 8px 4px;
          font-weight: 500;
          font-size: 14px;
        }
        
        .rbc-calendar-custom .rbc-today {
          background-color: hsl(var(--accent));
        }
        
        .rbc-calendar-custom .rbc-off-range-bg {
          background-color: hsl(var(--muted) / 0.3);
        }
        
        .rbc-calendar-custom .rbc-date-cell {
          padding: 8px 4px;
          text-align: right;
          color: hsl(var(--foreground));
        }
        
        .rbc-calendar-custom .rbc-date-cell.rbc-off-range {
          color: hsl(var(--muted-foreground));
        }
        
        .rbc-calendar-custom .rbc-time-header-content {
          border-left: 1px solid hsl(var(--border));
        }
        
        .rbc-calendar-custom .rbc-time-content > * + * > * {
          border-left: 1px solid hsl(var(--border));
        }
        
        .rbc-calendar-custom .rbc-event {
          border: none !important;
          border-radius: 6px;
          font-size: 12px;
          padding: 2px 6px;
          font-weight: 500;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .rbc-calendar-custom .rbc-event:focus {
          outline: 2px solid hsl(var(--ring));
          outline-offset: 2px;
        }
        
        .rbc-calendar-custom .rbc-month-row {
          border-bottom: 1px solid hsl(var(--border));
        }
        
        .rbc-calendar-custom .rbc-date-cell {
          border-right: 1px solid hsl(var(--border));
        }
        
        .rbc-calendar-custom .rbc-month-view .rbc-row {
          border-bottom: 1px solid hsl(var(--border));
        }
        
        .rbc-calendar-custom .rbc-day-bg {
          border-right: 1px solid hsl(var(--border));
        }
      `}</style>
    </>
  );
};
