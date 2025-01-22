import { cn } from "@/lib/utils";

interface LoadingIndicatorProps {
  message?: string;
  className?: string;
}

export function LoadingIndicator({ message = "Generating your workout plan...", className }: LoadingIndicatorProps) {
  const steps = [
    "Analyzing fitness preferences",
    "Designing progressive overload",
    "Optimizing workout structure",
    "Finalizing your program"
  ];

  return (
    <div className={cn("fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50", className)}>
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-gradient" />
        
        <h3 className="text-2xl font-oswald text-primary text-center relative z-10">{message}</h3>
        
        <div className="space-y-4 relative z-10">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded-full bg-primary/20 relative">
                <div className={cn(
                  "absolute inset-0 rounded-full bg-primary transform scale-0",
                  "animate-[ping_1.5s_ease-in-out_infinite]",
                  `delay-[${index * 400}ms]`
                )} />
              </div>
              <span className="text-gray-600">{step}</span>
            </div>
          ))}
        </div>

        <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative z-10">
          <div className="h-full bg-primary rounded-full w-full animate-progress" />
        </div>
      </div>
    </div>
  );
}