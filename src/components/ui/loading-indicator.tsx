import { cn } from "@/lib/utils";

export function LoadingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("w-full max-w-md mx-auto p-6 space-y-4", className)}>
      <div className="relative overflow-hidden rounded-lg bg-white/20 backdrop-blur-sm p-8 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 opacity-20 animate-gradient"></div>
        
        <div className="relative space-y-4">
          <h3 className="text-2xl font-oswald text-amber-700 text-center">Generating Your Workout</h3>
          
          <div className="space-y-2">
            {["Analyzing requirements", "Designing progression", "Optimizing intensity"].map((step, i) => (
              <div key={step} className="flex items-center space-x-3">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  i === 0 ? "bg-amber-600 animate-pulse" :
                  i === 1 ? "bg-amber-400" :
                  "bg-amber-200"
                )}/>
                <span className="text-amber-700">{step}</span>
              </div>
            ))}
          </div>

          <div className="h-2 w-full bg-amber-100 rounded-full overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600 animate-progress"/>
          </div>
        </div>
      </div>
    </div>
  );
}