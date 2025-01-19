import { Input } from "../ui/input";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchInput = ({ value, onChange }: SearchInputProps) => {
  return (
    <Input
      placeholder="Search for barbells, dumbbells, kettlebells, or other training equipment..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-black text-primary border-[3px] border-primary shadow-[4px_4px_0px_0px_#ea384c] rounded-[20px] placeholder:text-primary/60 font-oswald uppercase tracking-wide"
    />
  );
};