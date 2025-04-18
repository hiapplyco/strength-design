
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { JournalCalendar } from "./JournalCalendar";
import { WidgetPalette } from "./widgets/WidgetPalette";
import { WidgetType } from "./widgets/WidgetRegistry";

export const JournalPage: React.FC = () => {
  const [page, setPage] = useState({
    id: uuidv4(),
    title: "My Journal Page",
    date: new Date().toISOString(),
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPage(prevPage => ({
      ...prevPage,
      title: e.target.value
    }));
  };

  const saveJournal = () => {
    const journalData = JSON.stringify(page);
    localStorage.setItem(`journal_${page.id}`, journalData);
    console.log("Journal saved:", page);
  };

  const handleWidgetSelect = (widgetType: WidgetType) => {
    console.log("Selected widget:", widgetType);
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Input
            value={page.title}
            onChange={handleTitleChange}
            className="text-2xl font-bold bg-transparent border-none shadow-none h-auto text-primary px-0 focus-visible:ring-0"
            placeholder="Untitled Journal"
          />
          <div className="flex gap-2">
            <Button 
              variant="outline"
              className="gap-2"
              onClick={saveJournal}
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-[300px,1fr] gap-4">
          <div className="sticky top-4">
            <WidgetPalette onWidgetSelect={handleWidgetSelect} />
          </div>
          <div>
            <JournalCalendar />
          </div>
        </div>
      </div>
    </div>
  );
};
