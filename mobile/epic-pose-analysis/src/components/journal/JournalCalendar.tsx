
import { useState } from "react";
import { Calendar, dateFnsLocalizer, Event } from "react-big-calendar";
import withDragAndDrop, { withDragAndDropProps } from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay, addHours, startOfHour } from "date-fns";
import enUS from "date-fns/locale/en-US";

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

export const JournalCalendar = () => {
  // Create a new date for today
  const today = new Date();
  
  // Create dates for the sample event
  const eventStart = new Date(today);
  const eventEnd = new Date(today);
  // Add 1 hour to the end time
  eventEnd.setHours(eventEnd.getHours() + 1);
  
  const [events, setEvents] = useState<Event[]>([
    {
      title: "Sample Event",
      start: eventStart,
      end: eventEnd,
    },
  ]);

  const onEventResize: withDragAndDropProps['onEventResize'] = data => {
    const { start, end } = data;
    setEvents(currentEvents => {
      const updatedEvents = currentEvents.map(event => {
        if (event === data.event) {
          return { ...event, start: new Date(start), end: new Date(end) };
        }
        return event;
      });
      return updatedEvents;
    });
  };

  const onEventDrop: withDragAndDropProps['onEventDrop'] = data => {
    const { start, end } = data;
    setEvents(currentEvents => {
      const updatedEvents = currentEvents.map(event => {
        if (event === data.event) {
          return { ...event, start: new Date(start), end: new Date(end) };
        }
        return event;
      });
      return updatedEvents;
    });
  };

  return (
    <div className="h-[600px] bg-muted/10 rounded-lg border">
      <DnDCalendar
        defaultView="week"
        events={events}
        localizer={localizer}
        onEventDrop={onEventDrop}
        onEventResize={onEventResize}
        resizable
        style={{ height: "100%" }}
      />
    </div>
  );
};
