
import { PageHeader } from "@/components/generated-workouts/PageHeader";
import { WorkoutList } from "@/components/generated-workouts/WorkoutList";

const GeneratedWorkouts = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <PageHeader />
          <WorkoutList />
        </div>
      </div>
    </div>
  );
};

export default GeneratedWorkouts;
