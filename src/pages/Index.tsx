
import { 
  Dumbbell, 
  MessageSquare, 
  BarChart3, 
  ArrowRight, 
  Sparkles, 
  Star,
  Book,
  Video,
  Crown,
  Apple
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { width, spacing, text, layout, touch } from "@/utils/responsive";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const navigate = useNavigate();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { user } = useAuth();

  const handleAuth = () => {
    if (user) {
      navigate("/workout-generator");
    } else {
      setShowAuthDialog(true);
    }
  };

  const header = (
    <div className={`${spacing.section} ${spacing.container} text-center ${layout.noOverflow}`}>
      <h1 className={`${text.title} font-bold text-primary`}>strength.design</h1>
      <p className={`${text.subtitle} text-foreground/80 ${width.content} mt-2`}>
        AI-powered tools to build dynamic workout programs, track your progress, and share your knowledge with the world.
      </p>
      
      <div className={`${layout.center} ${spacing.gap} ${spacing.section}`}>
        <Button size="lg" onClick={handleAuth}>
          {user ? "Go to Generator" : "Sign Up & Get Started"}
          <ArrowRight className={touch.icon} />
        </Button>
        <Button variant="link" asChild>
          <Link to="/design-system">Design System</Link>
        </Button>
      </div>
    </div>
  );

  return (
    <StandardPageLayout header={header} className="h-screen">
      <div className={`${width.full} ${layout.noOverflow} flex-1 min-h-0 ${spacing.container}`}>
        {/* Features Teaser */}
        <div className={`${spacing.section} text-center`}>
          <h2 className={`text-xl md:text-2xl font-semibold text-primary mb-4`}>
            Unlock Your Potential with AI-Powered Fitness Tools
          </h2>
          <p className={`${text.subtitle} text-foreground/80 ${width.content} mx-auto`}>
            Explore our suite of tools designed to revolutionize your fitness journey. From AI-powered workout generation to in-depth movement analysis, we provide the resources you need to achieve your goals.
          </p>
        </div>

        {/* Features Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="bg-card/40 backdrop-blur-sm border-border/50 hover:bg-card/60 transition-all duration-300 group cursor-pointer" onClick={() => navigate('/workout-generator')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">AI Workout Generator</h3>
              <p className="text-foreground/80">Generate personalized workouts based on your goals, fitness level, and available equipment.</p>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-sm border-border/50 hover:bg-card/60 transition-all duration-300 group cursor-pointer" onClick={() => navigate('/nutrition-diary')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Apple className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground flex items-center justify-center gap-2">
                Nutrition Diary
                <Crown className="h-4 w-4 text-amber-500" />
              </h3>
              <p className="text-foreground/80">Track your daily nutrition with real-time macro calculations and comprehensive food database.</p>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-sm border-border/50 hover:bg-card/60 transition-all duration-300 group cursor-pointer" onClick={() => navigate('/program-chat')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground flex items-center justify-center gap-2">
                Program Chat
                <Crown className="h-4 w-4 text-amber-500" />
              </h3>
              <p className="text-foreground/80">Chat with an AI coach about fitness, nutrition, and training strategies.</p>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-sm border-border/50 hover:bg-card/60 transition-all duration-300 group cursor-pointer" onClick={() => navigate('/movement-analysis')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground flex items-center justify-center gap-2">
                Movement Analysis
                <Crown className="h-4 w-4 text-amber-500" />
              </h3>
              <p className="text-foreground/80">Advanced video analysis for technique improvement and injury prevention.</p>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-sm border-border/50 hover:bg-card/60 transition-all duration-300 group cursor-pointer" onClick={() => navigate('/journal')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Book className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground flex items-center justify-center gap-2">
                Smart Journal
                <Crown className="h-4 w-4 text-amber-500" />
              </h3>
              <p className="text-foreground/80">Track your progress with intelligent insights and personalized recommendations.</p>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-sm border-border/50 hover:bg-card/60 transition-all duration-300 group cursor-pointer" onClick={() => navigate('/publish-program')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground flex items-center justify-center gap-2">
                Publish Program
                <Crown className="h-4 w-4 text-amber-500" />
              </h3>
              <p className="text-foreground/80">Create and share professional workout videos with AI-generated scripts.</p>
            </CardContent>
          </Card>
        </div>

        {/* Testimonials Section */}
        <div className={`${spacing.section} text-center`}>
          <h2 className={`text-xl md:text-2xl font-semibold text-primary mb-4`}>
            Hear From Our Users
          </h2>
          <p className={`${text.subtitle} text-foreground/80 ${width.content} mx-auto`}>
            Don't just take our word for it. See how Strength.Design is helping people around the world achieve their fitness goals.
          </p>
        </div>

        {/* Testimonials Carousel (Placeholder) */}
        <div className="relative">
          {/* Placeholder for Testimonials Carousel */}
          <div className="h-48 bg-muted rounded-lg flex items-center justify-center text-foreground/50">
            Testimonials Carousel Coming Soon
          </div>
          {/* You can add navigation buttons or indicators here */}
        </div>
      </div>

      <AuthDialog 
        isOpen={showAuthDialog} 
        onOpenChange={setShowAuthDialog} 
        onSuccess={() => {
          setShowAuthDialog(false);
          navigate("/workout-generator");
        }} 
      />
    </StandardPageLayout>
  );
}
