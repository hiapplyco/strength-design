
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ClickableExerciseProps {
  name: string;
  onSelect: (name: string) => void;
}

export function ClickableExercise({ name, onSelect }: ClickableExerciseProps) {
  const { toast } = useToast();

  const handleClick = () => {
    onSelect(name);
    toast({
      title: "Exercise Selected",
      description: `"${name}" has been added to the search`,
      duration: 2000,
    });
  };

  return (
    <Button
      variant="link"
      className="p-0 h-auto text-primary hover:text-primary/80 underline underline-offset-4 font-normal"
      onClick={handleClick}
    >
      {name}
    </Button>
  );
}
