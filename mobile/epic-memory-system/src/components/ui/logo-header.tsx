
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
      "uppercase tracking-wider",
      "bg-gradient-to-r from-[#4CAF50] via-[#9C27B0] to-[#FF1493] bg-clip-text text-transparent",
      "inline-block mb-4 sm:mb-6 max-w-full overflow-hidden text-ellipsis",
      isMobile ? "text-base" : "",
      className
    )}>
      {children}
    </h1>
  );
};
