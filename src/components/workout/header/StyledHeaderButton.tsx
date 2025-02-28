
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
        "w-full sm:w-auto text-lg font-oswald font-bold text-black dark:text-white transform -skew-x-12 uppercase tracking-wider text-center border-[3px] border-black rounded-sm px-4 py-2 shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),4px_4px_0px_0px_#C4A052,8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),2px_2px_0px_0px_#C4A052,4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 bg-gradient-to-r from-[#C4A052] to-[#E5C88E]",
        variant === "secondary" && "from-[#B8860B] to-[#DAA520]",
        className
      )}
    />
  );
}
