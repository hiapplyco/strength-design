
import { useState } from "react";
import { Calendar, dateFnsLocalizer, Event } from "react-big-calendar";
import withDragAndDrop, { withDragAndDropProps } from "react-big-calendar/lib/addons/dragAndDrop";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import addHours from "date-fns/addHours";
import startOfHour from "date-fns/startOfHour";

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
  const [events, setEvents] = useState<Event[]>([
    {
      title: "Sample Event",
      start: new Date(),
      end: addHours(new Date(), 1),
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
