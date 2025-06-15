
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { SmartJournalEntry } from "./SmartJournalEntry";
import { ScheduleCalendar } from "./ScheduleCalendar";
import { ScheduleAddWorkoutButton } from "./ScheduleAddWorkoutButton";

export const JournalPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 overflow-x-hidden pb-10">
      <div className="mb-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary">
          AI Workout Journal
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Log your fitness journey, moods, and workouts with intelligent tools to help you grow.
        </p>
      </div>
      <Tabs defaultValue="journal" className="flex-1 flex flex-col">
        <div className="mb-4">
          <TabsList className="flex w-full gap-2 py-0">
            <TabsTrigger value="journal" className="gap-2 px-3 py-2 flex-1 text-base">
              <BookOpen className="h-5 w-5" />
              <span>Journal</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2 px-3 py-2 flex-1 text-base">
              <Target className="h-5 w-5" />
              <span>Schedule</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* JOURNAL */}
        <TabsContent value="journal" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Date and Info */}
            <div className="md:col-span-1 order-1 flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border w-full max-w-sm mx-auto"
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Getting the Most from Your Journal</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="pl-4 text-sm text-muted-foreground list-disc space-y-1">
                    <li>Pick a date to log your entry or update previous records.</li>
                    <li>Reflect on your day, workouts, and feelings.</li>
                    <li>Rate your mood, energy, sleep, and stress for better insights.</li>
                    <li>Journal entries help us recommend optimal workout times and intensity!</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            {/* Journal Entry */}
            <div className="md:col-span-2 order-2 flex flex-col">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Daily Journal Entry
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SmartJournalEntry selectedDate={selectedDate} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* SCHEDULE */}
        <TabsContent value="schedule" className="mt-0 relative">
          <div className="flex flex-col gap-6 w-full">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Your Workout Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <ScheduleCalendar />
                </div>
              </CardContent>
            </Card>
            {/* Floating Add Workout Button */}
            <ScheduleAddWorkoutButton />
            {/* Optionally add a quick stats strip here in future */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
