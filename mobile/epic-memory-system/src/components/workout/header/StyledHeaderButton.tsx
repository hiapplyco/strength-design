
import { Button } from "@/components/ui/button";
import { type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StyledHeaderButtonProps = Omit<ButtonProps, 'variant'> & {
  variant?: "default" | "secondary";
};

export function StyledHeaderButton({ 
  className, 
  variant = "default",
  ...props 
}: StyledHeaderButtonProps) {
  return (
    <Button
      {...props}
      variant="default"
      className={cn(
        "w-full sm:w-auto text-lg font-medium text-white rounded-md px-4 py-2 transition-all duration-200",
        variant === "secondary" && "opacity-90",
        className
      )}
    />
  );
}
