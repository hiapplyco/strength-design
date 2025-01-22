import { Textarea } from "@/components/ui/textarea";

interface WorkoutSectionProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minHeight?: string;
  isDescription?: boolean;
}

export function WorkoutSection({ label, value, onChange, minHeight = "80px", isDescription = false }: WorkoutSectionProps) {
  return (
    <div className={`space-y-2 rounded-[20px] ${isDescription ? 'bg-primary' : 'bg-muted'} p-4 border-[3px] border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
      <label className={`text-sm font-bold uppercase tracking-tight ${isDescription ? 'text-white' : 'text-primary'}`}>
        {label}
      </label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${isDescription ? 'min-h-[60px] text-lg font-collegiate uppercase tracking-wide' : 'min-h-[80px]'} resize-y bg-white text-black font-medium border-2 border-primary shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-[20px]`}
        style={{ minHeight }}
      />
    </div>
  );
}