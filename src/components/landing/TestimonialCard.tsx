
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Quote } from "lucide-react";
import { typography, spacing } from "@/lib/design-tokens";

interface TestimonialCardProps {
  name: string;
  role: string;
  testimonial: string;
  imagePath: string;
  fallbackInitials: string;
}

export function TestimonialCard({ name, role, testimonial, imagePath, fallbackInitials }: TestimonialCardProps) {
  return (
    <Card variant="elevated" className="h-full">
      <CardContent className={`${spacing.component.lg} flex flex-col items-center text-center space-y-4`}>
        <Quote className="w-8 h-8 text-primary/60" />
        
        <p className={`${typography.body.default} text-foreground/80 italic leading-relaxed`}>
          "{testimonial}"
        </p>
        
        <div className="flex flex-col items-center space-y-2 mt-auto">
          <Avatar className="w-16 h-16">
            <AvatarImage 
              src={`https://images.unsplash.com/${imagePath}?w=150&h=150&fit=crop&crop=face`}
              alt={name}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {fallbackInitials}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h4 className={`${typography.body.large} font-semibold text-foreground`}>
              {name}
            </h4>
            <p className={`${typography.caption} text-primary font-medium`}>
              {role}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
