
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

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">AI Workout Journal</h1>
            <p className="text-muted-foreground mt-1">
              Track your fitness journey with intelligent insights and planning
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Brain className="h-4 w-4" />
            Get AI Insights
          </Button>
        </div>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="journal" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Journal
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Target className="h-4 w-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="widgets" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Widgets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Smart Calendar View
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SmartJournalCalendar />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="journal" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Select Date</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      className="rounded-md border"
                    />
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-2">
                <SmartJournalEntry selectedDate={selectedDate} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WorkoutScheduler />
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Your scheduled workouts will appear here with AI-powered recommendations.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="widgets" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <WidgetPalette onWidgetSelect={handleWidgetSelect} />
              </div>
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Widget Canvas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Drag widgets here to customize your journal experience.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
