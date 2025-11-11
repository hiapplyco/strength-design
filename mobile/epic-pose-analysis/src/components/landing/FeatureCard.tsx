
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badgeText: string;
  badgeType: "free" | "pro";
  onClick: () => void;
}

export const FeatureCard = ({ 
  icon: Icon, 
  title, 
  description, 
  badgeText, 
  badgeType, 
  onClick 
}: FeatureCardProps) => {
  return (
    <Card 
      className="bg-card/40 backdrop-blur-sm border-border/50 hover:bg-card/60 transition-all duration-300 group cursor-pointer relative" 
      onClick={onClick}
    >
      <div className="absolute top-3 right-3">
        <Badge 
          variant="secondary" 
          className={
            badgeType === "free" 
              ? "bg-green-100 text-green-800" 
              : "bg-amber-100 text-amber-800 flex items-center gap-1"
          }
        >
          {badgeType === "pro" && <Crown className="h-3 w-3" />}
          {badgeText}
        </Badge>
      </div>
      <CardContent className="p-6 text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
        <p className="text-foreground/80">{description}</p>
      </CardContent>
    </Card>
  );
};
