
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useWorkoutSessions, WorkoutSessionWithGeneratedWorkout } from "@/hooks/useWorkoutSessions";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { DailyWorkoutDetailModal } from "./DailyWorkoutDetailModal";
import { format, startOfDay } from "date-fns";
import { Dumbbell, Heart } from "lucide-react";

export const FullCalendarWorkoutCalendar = () => {
  const { sessions, updateSession } = useWorkoutSessions();
  const { entries } = useJournalEntries();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedWorkoutSession, setSelectedWorkoutSession] = useState<WorkoutSessionWithGeneratedWorkout | undefined>();

  const calendarEvents = [
    // Workout sessions
    ...sessions.map(session => ({
      id: `workout-${session.id}`,
      title: session.generated_workouts?.title || 'Training Session',
      start: session.scheduled_date,
      end: session.scheduled_date,
      allDay: true,
      backgroundColor: getWorkoutColor(session.status),
      borderColor: getWorkoutColor(session.status),
      textColor: 'white',
      extendedProps: {
        type: 'workout',
        sessionId: session.id,
        status: session.status,
        data: session
      }
    })),
    // Journal entries
    ...entries.map(entry => ({
      id: `journal-${entry.id}`,
      title: entry.title || 'Journal Entry',
      start: entry.date,
      end: entry.date,
      allDay: true,
      backgroundColor: '#8b5cf6',
      borderColor: '#7c3aed',
      textColor: 'white',
      extendedProps: {
        type: 'journal',
        entryId: entry.id,
        data: entry
      }
    }))
  ];

  function getWorkoutColor(status: string) {
    switch (status) {
      case 'completed':
        return '#22c55e';
      case 'in_progress':
        return '#f59e0b';
      case 'skipped':
        return '#ef4444';
      default:
        return '#3b82f6';
    }
  }

  const handleDateClick = (info: any) => {
    const clickedDate = new Date(info.date);
    const workoutSession = sessions.find(session => 
      format(new Date(session.scheduled_date), 'yyyy-MM-dd') === format(clickedDate, 'yyyy-MM-dd')
    );
    
    setSelectedDate(clickedDate);
    setSelectedWorkoutSession(workoutSession);
  };

  const handleEventClick = (info: any) => {
    const eventDate = new Date(info.event.start);
    const extendedProps = info.event.extendedProps;
    
    if (extendedProps.type === 'workout' && extendedProps.data) {
      setSelectedWorkoutSession(extendedProps.data as WorkoutSessionWithGeneratedWorkout);
      setSelectedDate(eventDate);
    } else {
      setSelectedDate(eventDate);
      setSelectedWorkoutSession(undefined);
    }
  };

  const handleEventDrop = async (info: any) => {
    const extendedProps = info.event.extendedProps;
    if (extendedProps.type === 'workout' && extendedProps.sessionId) {
      const newDate = format(new Date(info.event.start), 'yyyy-MM-dd');
      await updateSession(extendedProps.sessionId, { scheduled_date: newDate });
    }
  };

  const renderEventContent = (eventInfo: any) => {
    const { extendedProps } = eventInfo.event;
    const icon = extendedProps.type === 'workout' ? 
      <Dumbbell className="h-3 w-3 mr-1" /> : 
      <Heart className="h-3 w-3 mr-1" />;

    return (
      <div className="flex items-center text-xs">
        {icon}
        <span className="truncate">{eventInfo.event.title}</span>
      </div>
    );
  };

  return (
    <>
      <div className="bg-background rounded-lg border shadow-sm">
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
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Skipped</span>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={calendarEvents}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            editable={true}
            droppable={true}
            eventContent={renderEventContent}
            height="auto"
            dayMaxEvents={3}
            moreLinkClick="popover"
            eventDisplay="block"
            displayEventTime={false}
            dayHeaderFormat={{ weekday: 'short' }}
            eventClassNames="cursor-pointer hover:opacity-80 transition-opacity"
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
    </>
  );
};
