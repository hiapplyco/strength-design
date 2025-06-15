
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";

export default function GeneratedWorkouts() {
  const [workouts, setWorkouts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("generated_workouts")
          .select("*")
          .eq("user_id", user.id)
          .order("generated_at", { ascending: false });

        if (error) {
          console.error("Error fetching workouts:", error);
          return;
        }

        setWorkouts(data);
      } catch (error) {
        console.error("Error fetching workouts:", error);
      }
    };

    fetchWorkouts();
  }, [user]);

  const filteredWorkouts = workouts.filter((workout) =>
    workout.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <StandardPageLayout
      header={
        <div className="py-6 text-center">
          <h1 className="text-3xl font-bold text-primary">Your Generated Workouts</h1>
          <p className="text-lg text-foreground/80 max-w-3xl mx-auto mt-2">
            Access all of your previously generated programs.
          </p>
        </div>
      }
    >
      <div className="flex-1 flex flex-col h-full">
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search workouts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md mx-auto"
          />
        </div>
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredWorkouts.map((workout) => (
              <Card key={workout.id} className="bg-card/95 backdrop-blur">
                <CardContent className="p-4">
                  <h2 className="text-lg font-semibold mb-2">{workout.title}</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    {workout.summary}
                  </p>
                  <Link to="/document-editor" state={{ content: JSON.stringify(workout.workout_data, null, 2) }}>
                    <Button className="w-full">View Workout</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </StandardPageLayout>
  );
}
