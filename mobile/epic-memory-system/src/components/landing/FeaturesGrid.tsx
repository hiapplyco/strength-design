
import { useNavigate } from "react-router-dom";
import { FeatureCard } from "./FeatureCard";
import { 
  Dumbbell, 
  MessageSquare, 
  BarChart3, 
  Apple,
  Book,
  Video
} from "lucide-react";

export const FeaturesGrid = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Dumbbell,
      title: "AI Workout Generator",
      description: "Generate personalized workouts based on your goals, fitness level, and available equipment.",
      badgeText: "3 FREE",
      badgeType: "free" as const,
      onClick: () => navigate('/workout-generator')
    },
    {
      icon: Apple,
      title: "Nutrition Diary",
      description: "Track your daily nutrition with real-time macro calculations and comprehensive food database.",
      badgeText: "PRO",
      badgeType: "pro" as const,
      onClick: () => navigate('/nutrition-diary')
    },
    {
      icon: MessageSquare,
      title: "Program Chat",
      description: "Chat with an AI coach about fitness, nutrition, and training strategies.",
      badgeText: "PRO",
      badgeType: "pro" as const,
      onClick: () => navigate('/program-chat')
    },
    {
      icon: BarChart3,
      title: "Movement Analysis",
      description: "Advanced video analysis for technique improvement and injury prevention.",
      badgeText: "PRO",
      badgeType: "pro" as const,
      onClick: () => navigate('/movement-analysis')
    },
    {
      icon: Book,
      title: "Smart Journal",
      description: "Track your progress with intelligent insights and personalized recommendations.",
      badgeText: "PRO",
      badgeType: "pro" as const,
      onClick: () => navigate('/journal')
    },
    {
      icon: Video,
      title: "Publish Program",
      description: "Create and share professional workout videos with AI-generated scripts.",
      badgeText: "PRO",
      badgeType: "pro" as const,
      onClick: () => navigate('/publish-program')
    }
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
      {features.map((feature) => (
        <FeatureCard
          key={feature.title}
          icon={feature.icon}
          title={feature.title}
          description={feature.description}
          badgeText={feature.badgeText}
          badgeType={feature.badgeType}
          onClick={feature.onClick}
        />
      ))}
    </div>
  );
};
