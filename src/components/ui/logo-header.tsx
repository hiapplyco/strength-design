
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface LogoHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const LogoHeader = ({ children, className }: LogoHeaderProps) => {
  const isMobile = useIsMobile();
  
  return (
    <h1 className={cn(
      "text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-oswald font-bold",
      "transform -skew-x-12 uppercase tracking-wider",
      "border-[3px] sm:border-[4px] md:border-[6px] border-black rounded-md px-2 sm:px-3 md:px-4 py-2 sm:py-3",
      "shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,1),4px_4px_0px_0px_rgba(255,0,0,1),8px_8px_0px_0px_#C4A052]",
      "sm:shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),6px_6px_0px_0px_rgba(255,0,0,1),10px_10px_0px_0px_#C4A052]",
      "md:shadow-[inset_0px_0px_0px_2px_rgba(255,255,255,1),8px_8px_0px_0px_rgba(255,0,0,1),12px_12px_0px_0px_#C4A052]",
      "inline-block bg-black mb-4 sm:mb-6 max-w-full overflow-hidden text-ellipsis",
      "bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] bg-clip-text text-transparent",
      isMobile ? "px-2 py-1.5 text-base" : "",
      className
    )}>
      {children}
    </h1>
  );
};
