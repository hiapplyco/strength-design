
import { cn } from "@/lib/utils";

interface LogoHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const LogoHeader = ({ children, className }: LogoHeaderProps) => {
  return (
    <h1 className={cn(
      "text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-oswald font-bold text-destructive dark:text-white",
      "transform -skew-x-12 uppercase tracking-wider",
      "border-[6px] border-black rounded-lg px-4 py-3",
      "shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052]",
      "inline-block bg-black mb-6 whitespace-nowrap",
      className
    )}>
      {children}
    </h1>
  );
};
