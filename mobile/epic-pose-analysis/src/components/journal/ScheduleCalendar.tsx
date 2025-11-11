
import React, { useMemo } from "react";
import { useWorkoutSessions } from "@/hooks/useWorkoutSessions";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addHours } from "date-fns";
import enUS from "date-fns/locale/en-US";
import { Dumbbell, Zap } from "lucide-react";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export const ScheduleCalendar = () => {
  const { sessions, updateSession } = useWorkoutSessions();

  // Calendar events for scheduled workouts
  const events = useMemo(() => {
    return sessions
      .filter((session) => session.scheduled_date)
      .map((session) => {
        const start = new Date(session.scheduled_date + "T08:00:00");
        const end = addHours(start, session.generated_workouts?.estimated_duration_minutes ? session.generated_workouts.estimated_duration_minutes / 60 : 1);
        let title = session.generated_workouts?.title || "Workout";
        if (session.status === "completed") title += " (✅ Completed)";
        if (session.status === "skipped") title += " (⏭ Skipped)";
        return {
          id: session.id,
          title,
          start,
          end,
          status: session.status,
          workout: session.generated_workouts,
        };
      });
  }, [sessions]);

  // Simple DnD/resize handlers (update schedule)
  const onEventDrop = async ({ event, start }) => {
    await updateSession(event.id, { scheduled_date: format(start, "yyyy-MM-dd") });
  };
  const onEventResize = async ({ event, start, end }) => {
    await updateSession(event.id, { scheduled_date: format(start, "yyyy-MM-dd") });
  };

  // Color/status logic
  const eventPropGetter = (event) => {
    let bg = "#3b82f6";
    if (event.status === "completed") bg = "#22c55e";
    if (event.status === "skipped") bg = "#ef4444";
    return {
      style: {
        backgroundColor: bg,
        borderRadius: "8px",
        border: "none",
        color: "#fff",
        padding: "2px 8px",
        fontWeight: "500",
        fontSize: "13px",
      },
    };
  };

  // Custom event icons
  const CustomEvent = ({ event }) => (
    <div className="flex items-center gap-1 whitespace-nowrap truncate text-xs">
      <Dumbbell className="h-3 w-3 mr-1" />
      <span>{event.title}</span>
      {event.workout?.difficulty_level && (
        <span className="ml-1 text-yellow-400"><Zap className="h-3 w-3 inline" /></span>
      )}
    </div>
  );

  return (
    <div className="w-full calendar-responsive h-[500px]">
      <Calendar
        localizer={localizer}
        events={events}
        defaultView="week"
        views={["week", "month"]}
        step={60}
        startAccessor="start"
        endAccessor="end"
        components={{ event: CustomEvent }}
        eventPropGetter={eventPropGetter}
        onEventDrop={onEventDrop}
        onEventResize={onEventResize}
        resizable
        popup
        style={{ height: "100%", background: "transparent" }}
      />
      <div className="flex gap-4 mt-2 text-xs justify-end">
        <span className="flex items-center gap-1 text-blue-500">
          <span className="w-3 h-3 rounded bg-blue-500 inline-block"></span> Upcoming
        </span>
        <span className="flex items-center gap-1 text-green-500">
          <span className="w-3 h-3 rounded bg-green-500 inline-block"></span> Completed
        </span>
        <span className="flex items-center gap-1 text-red-500">
          <span className="w-3 h-3 rounded bg-red-500 inline-block"></span> Missed/Skipped
        </span>
      </div>
    </div>
  );
};
