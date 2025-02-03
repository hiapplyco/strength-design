import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

const GeneratedWorkouts = () => {
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const { data, error } = await supabase
          .from('workouts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setWorkouts(data);
      } catch (error) {
        console.error('Error fetching workouts:', error);
        toast({
          title: "Error",
          description: "Failed to load workouts. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkouts();
  }, [toast]);

  const handleWorkoutClick = (workout) => {
    // Navigate to workout details or perform action
    console.log('Clicked workout:', workout);
    // You can add navigation or other actions here
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage: 'url("/lovable-uploads/47062b35-74bb-47f1-aaa1-a642db4673ce.png")',
      }}
    >
      <div className="min-h-screen bg-black/75 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-4xl md:text-5xl lg:text-6xl font-oswald text-destructive dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[6px] border-black rounded-lg px-4 py-3 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052] inline-block bg-black mb-6">
              previous.programs
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Access and review your previously generated workout programs. Track your progress and adapt your training based on historical data.
            </p>
          </div>

          {isLoading ? (
            <p className="text-white text-center">Loading your workouts...</p>
          ) : (
            <div className="grid gap-4">
              {workouts.map((workout) => (
                <Card 
                  key={workout.id} 
                  className="bg-white/10 hover:bg-white/20 transition-colors cursor-pointer border-2 border-primary/20"
                  onClick={() => handleWorkoutClick(workout)}
                >
                  <CardHeader>
                    <CardTitle className="text-white">{workout.day}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[100px] w-full rounded-md border border-white/20 p-4">
                      <div className="space-y-2">
                        <p className="text-sm text-white/80 whitespace-pre-line">
                          {workout.description}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(workout.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratedWorkouts;