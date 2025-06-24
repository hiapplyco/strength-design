
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useJournalEntries } from "@/hooks/useJournalEntries";
import { useWorkoutSessions } from "@/hooks/useWorkoutSessions";
import { WaterTracker } from "@/components/nutrition-diary/WaterTracker";
import { MealAccordion } from "@/components/nutrition-diary/MealAccordion";
import { useNutritionData } from "@/hooks/useNutritionData";
import { format } from "date-fns";
import { Dumbbell, Heart, Apple, Droplets } from "lucide-react";
import type { WorkoutSessionWithGeneratedWorkout } from "@/hooks/useWorkoutSessions";
import type { Database } from "@/integrations/supabase/types";

type JournalEntry = Database['public']['Tables']['journal_entries']['Row'];

interface DailyWorkoutDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  workoutSession?: WorkoutSessionWithGeneratedWorkout;
}

export const DailyWorkoutDetailModal = ({ 
  open, 
  onOpenChange, 
  date, 
  workoutSession 
}: DailyWorkoutDetailModalProps) => {
  const { createEntry, updateEntry, entries } = useJournalEntries();
  const { updateSession, completeSession } = useWorkoutSessions();
  const { nutritionLog, targets } = useNutritionData(date);
  
  const [journalTitle, setJournalTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [moodRating, setMoodRating] = useState([5]);
  const [energyLevel, setEnergyLevel] = useState([5]);
  const [sleepQuality, setSleepQuality] = useState([5]);
  const [stressLevel, setStressLevel] = useState([5]);
  const [workoutNotes, setWorkoutNotes] = useState(workoutSession?.notes || '');

  // Find existing journal entry for this date
  const existingEntry = entries.find(
    entry => entry.date === format(date, 'yyyy-MM-dd')
  );

  React.useEffect(() => {
    if (existingEntry) {
      setJournalTitle(existingEntry.title || '');
      setJournalContent(existingEntry.content || '');
      setMoodRating([existingEntry.mood_rating || 5]);
      setEnergyLevel([existingEntry.energy_level || 5]);
      setSleepQuality([existingEntry.sleep_quality || 5]);
      setStressLevel([existingEntry.stress_level || 5]);
    }
  }, [existingEntry]);

  const handleSaveJournal = async () => {
    const journalData = {
      date: format(date, 'yyyy-MM-dd'),
      title: journalTitle,
      content: journalContent,
      mood_rating: moodRating[0],
      energy_level: energyLevel[0],
      sleep_quality: sleepQuality[0],
      stress_level: stressLevel[0]
    };

    if (existingEntry) {
      await updateEntry(existingEntry.id, journalData);
    } else {
      await createEntry(journalData);
    }
  };

  const handleCompleteWorkout = async () => {
    if (!workoutSession) return;
    
    await completeSession(workoutSession.id, {
      notes: workoutNotes,
      satisfaction_rating: 8, // Could make this configurable
    });
    
    // Also save journal entry
    await handleSaveJournal();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{format(date, 'EEEE, MMMM do, yyyy')}</span>
            {workoutSession && (
              <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-md">
                Workout Day
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Log your daily activities, nutrition, and reflections
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workout">
              <Dumbbell className="h-4 w-4 mr-1" />
              Workout
            </TabsTrigger>
            <TabsTrigger value="nutrition">
              <Apple className="h-4 w-4 mr-1" />
              Nutrition
            </TabsTrigger>
            <TabsTrigger value="journal">
              <Heart className="h-4 w-4 mr-1" />
              Journal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mood & Energy Cards */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Daily Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs">Mood: {moodRating[0]}/10</Label>
                    <Slider
                      value={moodRating}
                      onValueChange={setMoodRating}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Energy: {energyLevel[0]}/10</Label>
                    <Slider
                      value={energyLevel}
                      onValueChange={setEnergyLevel}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Water Tracker */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Droplets className="h-4 w-4" />
                    Hydration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WaterTracker 
                    consumed={nutritionLog?.water_consumed_ml || 0}
                    target={targets?.daily_water_ml || 2000}
                    date={date}
                  />
                </CardContent>
              </Card>
            </div>

            {workoutSession && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Today's Workout</CardTitle>
                  <CardDescription>
                    {workoutSession.generated_workouts?.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Status: <span className="capitalize">{workoutSession.status}</span>
                  </p>
                  {workoutSession.status === 'scheduled' && (
                    <Button 
                      onClick={handleCompleteWorkout}
                      className="mt-2"
                      size="sm"
                    >
                      Mark as Complete
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="workout" className="space-y-4">
            {workoutSession ? (
              <Card>
                <CardHeader>
                  <CardTitle>{workoutSession.generated_workouts?.title}</CardTitle>
                  <CardDescription>
                    {workoutSession.generated_workouts?.summary}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="workout-notes">Workout Notes</Label>
                    <Textarea
                      id="workout-notes"
                      value={workoutNotes}
                      onChange={(e) => setWorkoutNotes(e.target.value)}
                      placeholder="How did the workout go? Any modifications or observations..."
                      className="mt-2"
                    />
                  </div>
                  {workoutSession.notes && (
                    <div>
                      <Label>Workout Details</Label>
                      <div className="mt-2 p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                        {workoutSession.notes}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No workout scheduled for this day</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="nutrition" className="space-y-4">
            <div className="space-y-4">
              {['meal 1', 'meal 2', 'meal 3', 'meal 4', 'meal 5'].map((mealGroup) => (
                <MealAccordion
                  key={mealGroup}
                  mealGroup={mealGroup}
                  nutritionLogId={nutritionLog?.id}
                  date={date}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="journal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Reflection</CardTitle>
                <CardDescription>
                  How are you feeling today? What's on your mind?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="journal-title">Title</Label>
                  <Input
                    id="journal-title"
                    value={journalTitle}
                    onChange={(e) => setJournalTitle(e.target.value)}
                    placeholder="Give your day a title..."
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="journal-content">Reflection</Label>
                  <Textarea
                    id="journal-content"
                    value={journalContent}
                    onChange={(e) => setJournalContent(e.target.value)}
                    placeholder="Write about your day, your thoughts, your goals..."
                    className="mt-2 min-h-[120px]"
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Sleep Quality: {sleepQuality[0]}/10</Label>
                    <Slider
                      value={sleepQuality}
                      onValueChange={setSleepQuality}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Stress Level: {stressLevel[0]}/10</Label>
                    <Slider
                      value={stressLevel}
                      onValueChange={setStressLevel}
                      max={10}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </div>

                <Button onClick={handleSaveJournal} className="w-full">
                  Save Journal Entry
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
