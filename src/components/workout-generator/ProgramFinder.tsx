import React, { useState } from 'react';
import useProgramSearch, { type FitnessProgram } from '@/hooks/useProgramSearch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Dumbbell, Calendar, Target, Timer, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ProgramFinderProps {
  onSelectProgram?: (program: FitnessProgram) => void;
}

const ProgramFinder: React.FC<ProgramFinderProps> = ({ onSelectProgram }) => {
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { data, loading, error, refetch } = useProgramSearch(query);

  const handleSearch = () => {
    setQuery(searchInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSelectProgram = () => {
    if (data && onSelectProgram) {
      onSelectProgram(data);
    }
  };

  return (
    <Card variant="default" className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary" />
          Find a Fitness Program
        </CardTitle>
        <CardDescription>
          Search for popular fitness programs like Starting Strength, 5/3/1, StrongLifts, etc.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="e.g., Starting Strength, 5/3/1, StrongLifts..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button 
            onClick={handleSearch} 
            disabled={loading || !searchInput.trim()}
            size="icon"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error.message || 'Failed to search for program. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        {data && (
          <Card variant="ghost" className="border-primary/20">
            <CardHeader>
              <div className="space-y-2">
                <CardTitle className="text-xl">{data.programName}</CardTitle>
                <CardDescription className="text-sm">
                  {data.description}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {data.level}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {data.duration}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  {data.frequency}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Goals */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Goals</h4>
                  <div className="flex flex-wrap gap-1">
                    {data.goals.map((goal, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {goal}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Equipment */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Equipment Needed</h4>
                  <div className="flex flex-wrap gap-1">
                    {data.equipment.map((item, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Program Phases */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Program Structure</h4>
                  <ScrollArea className="h-[300px] pr-4">
                    <Accordion type="single" collapsible className="w-full">
                      {data.phases.map((phase, phaseIndex) => (
                        <AccordionItem key={phaseIndex} value={`phase-${phaseIndex}`}>
                          <AccordionTrigger className="text-sm">
                            <div className="flex items-center justify-between w-full pr-2">
                              <span>{phase.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {phase.duration}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 pt-2">
                              {phase.workouts.map((workout, workoutIndex) => (
                                <div key={workoutIndex} className="pl-4 space-y-2">
                                  <h5 className="font-medium text-sm flex items-center gap-2">
                                    {workout.name}
                                    {workout.day && (
                                      <Badge variant="outline" className="text-xs">
                                        {workout.day}
                                      </Badge>
                                    )}
                                  </h5>
                                  <div className="space-y-1 pl-4">
                                    {workout.exercises.map((exercise, exerciseIndex) => (
                                      <div key={exerciseIndex} className="text-xs text-muted-foreground">
                                        • {exercise.name}: {exercise.sets} × {exercise.reps}
                                        {exercise.rest && ` (Rest: ${exercise.rest})`}
                                        {exercise.notes && (
                                          <span className="block pl-3 italic">{exercise.notes}</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </ScrollArea>
                </div>

                {/* Progression Scheme */}
                {data.progressionScheme && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Progression Scheme
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {data.progressionScheme}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {data.notes && data.notes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Additional Notes</h4>
                    <ul className="space-y-1">
                      {data.notes.map((note, index) => (
                        <li key={index} className="text-xs text-muted-foreground pl-4">
                          • {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSelectProgram} 
                className="w-full"
                disabled={!onSelectProgram}
              >
                Use This Program
              </Button>
            </CardFooter>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgramFinder;