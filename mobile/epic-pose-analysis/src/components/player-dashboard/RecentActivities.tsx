
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

// Default activities if none are provided
const defaultActivities = [
  {
    date: "2023-06-15",
    time: "10:30 AM",
    type: "Training Session",
    details: "Completed high-intensity strength training focusing on lower body",
    duration: "75 min",
    performance: "Great"
  },
  {
    date: "2023-06-14",
    time: "2:15 PM",
    type: "Team Practice",
    details: "Participated in full team scrimmage and tactical drills",
    duration: "120 min",
    performance: "Good"
  },
  {
    date: "2023-06-13",
    time: "9:00 AM",
    type: "Mobility Session",
    details: "Completed mobility and recovery protocol with physical therapist",
    duration: "45 min",
    performance: "Excellent"
  },
  {
    date: "2023-06-12",
    time: "11:00 AM",
    type: "Training Session",
    details: "Upper body strength and conditioning workout",
    duration: "60 min",
    performance: "Good"
  },
  {
    date: "2023-06-10",
    time: "3:30 PM",
    type: "Competition",
    details: "Regional tournament - advanced to semifinals",
    duration: "240 min",
    performance: "Excellent"
  }
];

interface RecentActivitiesProps {
  activities?: any[];
}

export function RecentActivities({ activities = defaultActivities }: RecentActivitiesProps) {
  // Use the provided activities or default activities
  const recentActivities = Array.isArray(activities) && activities.length > 0 ? activities : defaultActivities;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
        <CardDescription>Latest training sessions and events</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-8">
            {recentActivities.map((activity, index) => (
              <div 
                key={index}
                className="relative pl-8 animate-in opacity-0 transition-all duration-300"
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  transitionDelay: `${index * 100}ms`
                }}
              >
                {/* Timeline connector */}
                <div className="absolute left-0 top-2 w-3 h-3 rounded-full bg-primary"></div>
                {index < recentActivities.length - 1 && (
                  <div className="absolute left-1.5 top-5 w-[1px] h-[calc(100%+2rem)] bg-border"></div>
                )}
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold">{activity.type}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {activity.performance}
                    </span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {activity.date} • {activity.time} • {activity.duration}
                  </div>
                  
                  <p className="text-sm text-foreground/80 mt-1">
                    {activity.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
