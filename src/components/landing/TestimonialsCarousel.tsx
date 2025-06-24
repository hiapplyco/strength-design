
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { TestimonialCard } from "./TestimonialCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    name: "Hart",
    role: "Bodybuilder",
    testimonial: "The AI workout generation completely transformed my training. It creates personalized muscle-building routines that adapt to my strength gains and recovery needs. I've seen incredible results in just 3 months.",
    imagePath: "https://ulnsvkrrdcmfiguibkpx.supabase.co/storage/v1/object/public/assets/bodybuilding.png",
    fallbackInitials: "HA"
  },
  {
    name: "Christine",
    role: "Swimmer",
    testimonial: "The nutrition tracking feature is a game-changer for my performance. It perfectly balances my macros for endurance training and helps me fuel my body for those long training sessions.",
    imagePath: "https://ulnsvkrrdcmfiguibkpx.supabase.co/storage/v1/object/public/assets/swimming.png",
    fallbackInitials: "CH"
  },
  {
    name: "Georgia",
    role: "Yogi",
    testimonial: "I love the journaling feature combined with mindful movement routines. It helps me track my flexibility progress and mental wellness journey. The app truly understands the mind-body connection.",
    imagePath: "https://ulnsvkrrdcmfiguibkpx.supabase.co/storage/v1/object/public/assets/yogi.png",
    fallbackInitials: "GE"
  },
  {
    name: "Chad",
    role: "CrossFit Athlete",
    testimonial: "Being able to monetize my expertise through the platform is incredible. I create custom CrossFit programs and sell them to my community. It's turned my passion into a thriving business.",
    imagePath: "https://ulnsvkrrdcmfiguibkpx.supabase.co/storage/v1/object/public/assets/crossfit.png",
    fallbackInitials: "CH"
  }
];

export function TestimonialsCarousel() {
  return (
    <div className="relative max-w-7xl mx-auto">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4 md:-ml-6">
          {testimonials.map((testimonial, index) => (
            <CarouselItem key={index} className="pl-4 md:pl-6 basis-full md:basis-1/2 lg:basis-1/3">
              <TestimonialCard {...testimonial} />
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Enhanced navigation buttons */}
        <CarouselPrevious className="hidden md:flex -left-6 bg-card/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-white transition-all duration-300 shadow-lg">
          <ChevronLeft className="h-5 w-5" />
        </CarouselPrevious>
        <CarouselNext className="hidden md:flex -right-6 bg-card/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-white transition-all duration-300 shadow-lg">
          <ChevronRight className="h-5 w-5" />
        </CarouselNext>
      </Carousel>
      
      {/* Enhanced mobile indicator */}
      <div className="flex flex-col items-center mt-8 md:hidden space-y-3">
        <div className="flex gap-2">
          {testimonials.map((_, index) => (
            <div key={index} className="w-2 h-2 rounded-full bg-primary/30"></div>
          ))}
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <div className="flex gap-1">
            <ChevronLeft className="w-4 h-4 text-primary/60" />
            <ChevronRight className="w-4 h-4 text-primary/60" />
          </div>
          <p className="text-xs text-primary font-medium">Swipe to explore</p>
        </div>
      </div>
    </div>
  );
}
