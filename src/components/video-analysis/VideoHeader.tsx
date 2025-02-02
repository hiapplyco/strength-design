import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface VideoHeaderProps {
  className?: string;
}

export const VideoHeader = ({ className = "" }: VideoHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className={`bg-black/40 backdrop-blur-sm rounded-xl p-8 max-w-3xl mx-auto ${className}`}>
      <h1 className="text-4xl font-bold text-white mb-4 text-center">
        Record and Share your workout with the World!
      </h1>
      <p className="text-xl text-gray-300 text-center mb-6">
        Not sure what to write? Generate a program{" "}
        <Button 
          variant="link" 
          className="text-xl text-accent hover:text-accent/80 p-0"
          onClick={() => navigate("/workout-generator")}
        >
          here!
        </Button>
      </p>
    </div>
  );
};