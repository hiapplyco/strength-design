
import { PageHeader } from "@/components/generated-workouts/PageHeader";
import { WorkoutList } from "@/components/generated-workouts/WorkoutList";
import { StyledLogo } from "@/components/ui/styled-logo";

const GeneratedWorkouts = () => {
  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed" 
         style={{ backgroundImage: 'url("/lovable-uploads/47062b35-74bb-47f1-aaa1-a642db4673ce.png")' }}>
      <div className="min-h-screen bg-black/75 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <StyledLogo size="large" className="mb-4" />
          </div>
          <PageHeader />
          <WorkoutList />
        </div>
      </div>
    </div>
  );
};

export default GeneratedWorkouts;
