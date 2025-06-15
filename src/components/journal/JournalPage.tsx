
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Target } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { SmartJournalEntry } from "./SmartJournalEntry";
import { WorkoutScheduler } from "./WorkoutScheduler";
import { useWorkoutSessions } from "@/hooks/useWorkoutSessions";
import { ScrollArea } from "@/components/ui/scroll-area";

export const JournalPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { sessions, isLoading } = useWorkoutSessions();

  // Get only the next 3 scheduled sessions, sorted by date ascending
  const upcomingSessions = sessions
    .filter(
      (session) =>
        session.status === "scheduled" &&
        (!session.scheduled_date || new Date(session.scheduled_date) >= new Date())
    )
    .sort((a, b) =>
      (a.scheduled_date || "").localeCompare(b.scheduled_date || "")
    )
    .slice(0, 3);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 overflow-x-hidden pb-10">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary">
          AI Workout Journal
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Log your fitness journey, moods, and workouts with intelligent tools to help you grow.
        </p>
      </div>

      {/* Tabs */}
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

        {/* JOURNAL TAB */}
        <TabsContent value="journal" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Date Picker and Info/Instructions */}
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
                  <CardTitle className="text-base">How to Use Your Journal</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="pl-4 text-sm text-muted-foreground list-disc space-y-1">
                    <li>Pick a date to log your entry or update previous records.</li>
                    <li>Reflect on your day, workouts, and feelings.</li>
                    <li>Rate your mood, energy, sleep, and stress for better insights.</li>
                    <li>Come back daily for a more complete journey!</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
            {/* Journal Entry Form Section */}
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

        {/* SCHEDULE TAB */}
        <TabsContent value="schedule" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Schedule a new workout */}
            <div className="order-1 flex flex-col gap-4">
              <WorkoutScheduler />
            </div>
            {/* Upcoming Sessions Summary */}
            <div className="order-2 flex flex-col gap-4">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Scheduled Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-sm text-muted-foreground">Loading...</div>
                  ) : upcomingSessions.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No upcoming sessions scheduled. Add a workout to get started!
                    </div>
                  ) : (
                    <ScrollArea className="h-60 pr-3 w-full">
                      <ul className="space-y-4">
                        {upcomingSessions.map((session) => (
                          <li key={session.id} className="border-l-4 border-primary pl-3">
                            <div className="font-semibold text-base text-primary">
                              {session.generated_workouts?.title || "Workout"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Scheduled for{" "}
                              <span className="font-medium">
                                {session.scheduled_date
                                  ? new Date(session.scheduled_date).toLocaleDateString(undefined, {
                                      weekday: "short",
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })
                                  : "—"}
                              </span>
                            </div>
                            {session.generated_workouts?.summary && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {session.generated_workouts.summary.slice(0, 60) + "..."}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
