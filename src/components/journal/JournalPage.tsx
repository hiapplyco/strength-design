
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, CalendarDays, BookOpen, Target, Brain } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { SmartJournalCalendar } from "./SmartJournalCalendar";
import { WorkoutScheduler } from "./WorkoutScheduler";
import { SmartJournalEntry } from "./SmartJournalEntry";
import { WidgetPalette } from "./widgets/WidgetPalette";

export const JournalPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleWidgetSelect = (widgetType: string) => {
    console.log("Selected widget:", widgetType);
  };

  console.log("JournalPage is rendering"); // Debug log

  return (
    <div className="w-full max-w-full min-h-0 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-1">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary truncate">AI Workout Journal</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Track your fitness journey with intelligent insights and planning
          </p>
        </div>
        <div className="flex-shrink-0">
          <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Get AI Insights</span>
            <span className="sm:hidden">AI Insights</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-shrink-0 mb-4">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="calendar" className="gap-1 sm:gap-2 px-2 sm:px-3 py-2">
              <CalendarDays className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="journal" className="gap-1 sm:gap-2 px-2 sm:px-3 py-2">
              <BookOpen className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">Journal</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-1 sm:gap-2 px-2 sm:px-3 py-2">
              <Target className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="widgets" className="gap-1 sm:gap-2 px-2 sm:px-3 py-2">
              <CalendarIcon className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">Widgets</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 min-h-0 overflow-auto">
          <TabsContent value="calendar" className="mt-0 h-full">
            <Card className="h-full">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <CalendarDays className="h-5 w-5" />
                  Smart Calendar View
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-4">
                <SmartJournalCalendar />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="journal" className="mt-0 h-full">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6 h-full">
              <div className="xl:col-span-2 order-2 xl:order-1">
                <Card className="h-full">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle className="text-lg">Select Date</CardTitle>
                  </CardHeader>
                  <CardContent className="flex justify-center p-4">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="rounded-md border w-full max-w-sm"
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="xl:col-span-3 order-1 xl:order-2">
                <SmartJournalEntry selectedDate={selectedDate} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="mt-0 h-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-full">
              <div className="flex flex-col">
                <WorkoutScheduler />
              </div>
              <div className="flex flex-col">
                <Card className="flex-1">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 p-4">
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Your scheduled workouts will appear here with AI-powered recommendations.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="widgets" className="mt-0 h-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 h-full">
              <div className="lg:col-span-1 order-2 lg:order-1">
                <WidgetPalette onWidgetSelect={handleWidgetSelect} />
              </div>
              <div className="lg:col-span-2 order-1 lg:order-2">
                <Card className="h-full">
                  <CardHeader className="flex-shrink-0">
                    <CardTitle className="text-lg">Widget Canvas</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 p-4">
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Drag widgets here to customize your journal experience.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
