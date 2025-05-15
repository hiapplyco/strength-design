
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { JournalCalendar } from "./JournalCalendar";
import { WidgetPalette } from "./widgets/WidgetPalette";
import { toast } from "@/components/ui/use-toast";
import { generateId } from "@/lib/utils";

export const JournalPage = () => {
  const [page, setPage] = useState({
    id: generateId(),
    title: "My Journal Page",
    date: new Date().toISOString()
  });

  const handleTitleChange = (e) => {
    setPage((prevPage) => ({
      ...prevPage,
      title: e.target.value
    }));
  };

  const saveJournal = () => {
    const journalData = JSON.stringify(page);
    localStorage.setItem(`journal_${page.id}`, journalData);
    console.log("Journal saved:", page);
    toast({
      title: "Journal Saved",
      description: "Your journal page has been saved successfully.",
      duration: 3000
    });
  };

  const handleWidgetSelect = (widgetType) => {
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
