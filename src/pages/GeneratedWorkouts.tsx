
import { PageHeader } from "@/components/generated-workouts/PageHeader";
import { WorkoutList } from "@/components/generated-workouts/WorkoutList";

const GeneratedWorkouts = () => {
  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed" 
         style={{ backgroundImage: 'url("/lovable-uploads/47062b35-74bb-47f1-aaa1-a642db4673ce.png")' }}>
      <div className="min-h-screen bg-black/75 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-16">
          <PageHeader />
          <WorkoutList />
        </div>
      </div>
    </div>
  );
};

export default GeneratedWorkouts;
