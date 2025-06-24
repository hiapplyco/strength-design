
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Quote, Star } from "lucide-react";
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
    <Card variant="elevated" className="h-full group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-primary/10 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
      <CardContent className={`${spacing.component.lg} flex flex-col items-center text-center space-y-6 relative`}>
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-primary/20 text-primary/20" />
          ))}
        </div>
        
        {/* Quote icon with better styling */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg"></div>
          <div className="relative bg-gradient-to-br from-primary to-primary/80 p-3 rounded-full">
            <Quote className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {/* Enhanced testimonial text */}
        <div className="relative">
          <p className={`${typography.body.large} text-foreground/90 italic leading-relaxed font-medium relative z-10`}>
            "{testimonial}"
          </p>
          <div className="absolute -top-2 -left-2 text-6xl text-primary/10 font-serif">"</div>
        </div>
        
        {/* Enhanced user info section */}
        <div className="flex flex-col items-center space-y-3 mt-auto pt-4 border-t border-primary/10">
          <div className="relative">
            <Avatar className="w-20 h-20 ring-4 ring-primary/20 ring-offset-2 ring-offset-card transition-all duration-300 group-hover:ring-primary/40">
              <AvatarImage 
                src={imagePath}
                alt={name}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg">
                {fallbackInitials}
              </AvatarFallback>
            </Avatar>
            {/* Online indicator */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-card flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          
          <div className="text-center">
            <h4 className={`${typography.body.large} font-bold text-foreground mb-1`}>
              {name}
            </h4>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <p className={`${typography.caption} text-primary font-semibold uppercase tracking-wider`}>
                {role}
              </p>
              <div className="w-2 h-2 bg-primary rounded-full"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
