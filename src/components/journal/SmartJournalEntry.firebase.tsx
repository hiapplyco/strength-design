import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Save, Heart, Zap, Moon, Brain } from 'lucide-react';
import { useJournalEntries } from '@/hooks/useJournalEntries';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface SmartJournalEntryProps {
  selectedDate: Date;
}

export const SmartJournalEntry = ({ selectedDate }: SmartJournalEntryProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [moodRating, setMoodRating] = useState([5]);
  const [energyLevel, setEnergyLevel] = useState([5]);
  const [sleepQuality, setSleepQuality] = useState([5]);
  const [stressLevel, setStressLevel] = useState([5]);
  const [isSaving, setIsSaving] = useState(false);
  const [existingEntry, setExistingEntry] = useState<any>(null);

  const { createEntry, updateEntry, entries } = useJournalEntries();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Check if entry exists for selected date
    const dateString = selectedDate.toISOString().split('T')[0];
    const existing = entries.find(entry => entry.date === dateString);
    
    if (existing) {
      setExistingEntry(existing);
      setTitle(existing.title || '');
      setContent(existing.content || '');
      setMoodRating([existing.mood_rating || 5]);
      setEnergyLevel([existing.energy_level || 5]);
      setSleepQuality([existing.sleep_quality || 5]);
      setStressLevel([existing.stress_level || 5]);
    } else {
      setExistingEntry(null);
      setTitle('');
      setContent('');
      setMoodRating([5]);
      setEnergyLevel([5]);
      setSleepQuality([5]);
      setStressLevel([5]);
    }
  }, [selectedDate, entries]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save journal entries",
          variant: "destructive"
        });
        return;
      }

      const entryData = {
        date: selectedDate.toISOString().split('T')[0],
        title: title || `Journal Entry - ${selectedDate.toLocaleDateString()}`,
        content,
        mood_rating: moodRating[0],
        energy_level: energyLevel[0],
        sleep_quality: sleepQuality[0],
        stress_level: stressLevel[0],
        user_id: user.id
      };

      if (existingEntry) {
        await updateEntry(existingEntry.id, entryData);
      } else {
        await createEntry(entryData);
      }
    } catch (error) {
      console.error('Error saving journal entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Journal Entry - {selectedDate.toLocaleDateString()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="How was your day?"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Thoughts & Reflections</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write about your day, workouts, feelings, or anything on your mind..."
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              <Label>Mood (1-10)</Label>
            </div>
            <Slider
              value={moodRating}
              onValueChange={setMoodRating}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="text-center text-sm text-muted-foreground">
              {moodRating[0]} / 10
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              <Label>Energy Level (1-10)</Label>
            </div>
            <Slider
              value={energyLevel}
              onValueChange={setEnergyLevel}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="text-center text-sm text-muted-foreground">
              {energyLevel[0]} / 10
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-blue-500" />
              <Label>Sleep Quality (1-10)</Label>
            </div>
            <Slider
              value={sleepQuality}
              onValueChange={setSleepQuality}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="text-center text-sm text-muted-foreground">
              {sleepQuality[0]} / 10
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <Label>Stress Level (1-10)</Label>
            </div>
            <Slider
              value={stressLevel}
              onValueChange={setStressLevel}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="text-center text-sm text-muted-foreground">
              {stressLevel[0]} / 10
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : existingEntry ? 'Update Entry' : 'Save Entry'}
        </Button>
      </CardContent>
    </Card>
  );
};