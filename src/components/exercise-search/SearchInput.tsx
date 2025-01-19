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
      className="bg-white text-black placeholder:text-gray-500"
    />
  );
};