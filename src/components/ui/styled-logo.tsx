
import { cn } from "@/lib/utils";

interface StyledLogoProps {
  className?: string;
  size?: "small" | "medium" | "large";
}

export const StyledLogo = ({ className, size = "medium" }: StyledLogoProps) => {
  const sizeClasses = {
    small: "text-lg sm:text-xl",
    medium: "text-xl sm:text-2xl",
    large: "text-2xl sm:text-3xl md:text-4xl"
  };

  return (
    <h1 
      className={cn(
        sizeClasses[size],
        "font-bold tracking-wider uppercase",
        "bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493]",
        "inline-block bg-clip-text text-transparent",
        className
      )}
    >
      strength.design
    </h1>
  );
};
