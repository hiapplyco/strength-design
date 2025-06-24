
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { TestimonialCard } from "./TestimonialCard";

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
    <div className="relative">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {testimonials.map((testimonial, index) => (
            <CarouselItem key={index} className="pl-2 md:pl-4 basis-full md:basis-1/2">
              <TestimonialCard {...testimonial} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
      
      {/* Mobile swipe indicator */}
      <div className="flex justify-center mt-4 md:hidden">
        <p className="text-xs text-muted-foreground">Swipe to see more testimonials</p>
      </div>
    </div>
  );
}
