
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SmartJournalCalendar } from './SmartJournalCalendar';
import { InsightsTab } from './insights/InsightsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, BookOpen, TrendingUp } from 'lucide-react';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { useWorkoutSessions } from '@/hooks/useWorkoutSessions';
import { format } from 'date-fns';

export const JournalPage: React.FC = () => {
  const { entries } = useJournalEntries();
  const { sessions } = useWorkoutSessions();

  const recentEntries = entries.slice(0, 5);
  const upcomingWorkouts = sessions
    .filter(session => session.status === 'scheduled')
    .slice(0, 3);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fitness Journal</h1>
          <p className="text-muted-foreground">
            Track your workouts, nutrition, and daily reflections with AI-powered insights
          </p>
        </div>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="entries" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Recent Entries
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <SmartJournalCalendar />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Workouts</CardTitle>
                <CardDescription>Your scheduled training sessions</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingWorkouts.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingWorkouts.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {session.generated_workouts?.title || 'Training Session'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(session.scheduled_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No upcoming workouts scheduled
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
                <CardDescription>Your recent activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Workouts This Week</span>
                    <span className="font-medium">
                      {sessions.filter(s => s.status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Journal Entries</span>
                    <span className="font-medium">{entries.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scheduled Sessions</span>
                    <span className="font-medium">
                      {sessions.filter(s => s.status === 'scheduled').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="entries" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Journal Entries</CardTitle>
              <CardDescription>Your latest reflections and thoughts</CardDescription>
            </CardHeader>
            <CardContent>
              {recentEntries.length > 0 ? (
                <div className="space-y-4">
                  {recentEntries.map((entry) => (
                    <div key={entry.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{entry.title || 'Untitled'}</h3>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(entry.date), 'MMM dd')}
                        </span>
                      </div>
                      {entry.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {entry.content}
                        </p>
                      )}
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {entry.mood_rating && <span>Mood: {entry.mood_rating}/10</span>}
                        {entry.energy_level && <span>Energy: {entry.energy_level}/10</span>}
                        {entry.sleep_quality && <span>Sleep: {entry.sleep_quality}/10</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No journal entries yet</p>
                  <p className="text-sm text-muted-foreground">
                    Click on a date in the calendar to start journaling
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <InsightsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};
