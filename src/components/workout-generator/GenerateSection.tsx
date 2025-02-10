
import { Send, Loader2, Check, X } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import type { Exercise } from "../exercise-search/types";

interface GenerateSectionProps {
  onGenerate: () => void;
  onClear: () => void;
  isGenerating: boolean;
  renderTooltip: () => React.ReactNode;
  isValid: boolean;
  selectedExercises?: Exercise[];
  fitnessLevel?: string;
  prescribedExercises?: string;
  injuries?: string;
  numberOfDays?: number;
  setNumberOfDays: (value: number) => void;
  weatherData?: any;
}

export function GenerateSection({ 
  onGenerate, 
  onClear,
  isGenerating,
  renderTooltip,
  isValid,
  selectedExercises = [],
  fitnessLevel = "",
  prescribedExercises = "",
  injuries = "",
  numberOfDays = 0,
  setNumberOfDays,
  weatherData
}: GenerateSectionProps) {
  const hasSelections = selectedExercises.length > 0 || fitnessLevel || prescribedExercises || injuries || numberOfDays > 0 || weatherData;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Send className="h-5 w-5 text-primary" />
        <h3 className="font-oswald text-lg">Create Your Workout</h3>
        {renderTooltip()}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-white">
            Number of Training Days:
          </label>
          <input
            type="number"
            min="1"
            max="12"
            value={numberOfDays}
            onChange={(e) => setNumberOfDays(Number(e.target.value))}
            className="w-20 rounded-md border border-primary/20 bg-black/20 px-3 py-2 text-sm text-white"
          />
        </div>
      </div>
      
      {hasSelections && (
        <Card className="bg-black/20 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg text-primary">Your Workout Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[200px] rounded-md border p-4">
              {numberOfDays > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-primary mb-1">Training Days</h4>
                  <p className="text-sm text-muted-foreground">{numberOfDays} day{numberOfDays > 1 ? 's' : ''} of training</p>
                </div>
              )}
              
              {fitnessLevel && (
                <div className="mb-4">
                  <h4 className="font-semibold text-primary mb-1">Fitness Level</h4>
                  <p className="text-sm text-muted-foreground capitalize">{fitnessLevel}</p>
                </div>
              )}

              {selectedExercises.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-primary mb-1">Selected Exercises</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {selectedExercises.map((exercise, index) => (
                      <li key={index}>{exercise.name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {prescribedExercises && (
                <div className="mb-4">
                  <h4 className="font-semibold text-primary mb-1">Prescribed Exercises</h4>
                  <p className="text-sm text-muted-foreground">{prescribedExercises}</p>
                </div>
              )}

              {injuries && (
                <div className="mb-4">
                  <h4 className="font-semibold text-primary mb-1">Health Considerations</h4>
                  <p className="text-sm text-muted-foreground">{injuries}</p>
                </div>
              )}

              {weatherData && (
                <div className="mb-4">
                  <h4 className="font-semibold text-primary mb-1">Weather Conditions</h4>
                  <p className="text-sm text-muted-foreground">
                    Weather data available for workout optimization
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button 
          onClick={() => {
            if (isValid && !isGenerating) {
              onGenerate();
            }
          }}
          disabled={isGenerating || !isValid}
          className={`w-full bg-primary text-primary-foreground hover:bg-primary/90 font-oswald uppercase tracking-wide transition-all duration-200 ${isGenerating ? 'opacity-75' : ''} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Generate
            </>
          )}
        </Button>
        <Button 
          onClick={onClear}
          variant="outline"
          disabled={isGenerating}
          className="w-full hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>
    </div>
  );
}
