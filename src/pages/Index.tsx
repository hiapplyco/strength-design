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
      
      {/* Enhanced Value Proposition */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mt-6 mb-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-blue-900">Start Your Transformation Today</h2>
        </div>
        <p className="text-blue-700 mb-4">
          Get <strong>3 FREE AI-powered workout programs</strong> worth up to a month of specialized training, 
          tailored specifically for your goals and equipment.
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-blue-600">
          <span>✓ Professional-grade programming</span>
          <span>✓ Personalized to your level</span>
          <span>✓ No credit card required</span>
        </div>
      </div>
      
      <div className={`${layout.center} ${spacing.gap} ${spacing.section}`}>
        <Button size="lg" onClick={handleAuth} className="bg-primary hover:bg-primary/90 px-8 py-3">
          <Dumbbell className="h-5 w-5 mr-2" />
          {user ? "Go to Generator" : "Start Free - Get 3 Workouts"}
          <ArrowRight className={touch.icon} />
        </Button>
        {!user && (
          <p className="text-sm text-muted-foreground">
            Join thousands of athletes already transforming their training
          </p>
        )}
      </div>
    </div>
  );

  return (
    <StandardPageLayout header={header} className="h-screen">
      <div className={`${width.full} ${layout.noOverflow} flex-1 min-h-0 ${spacing.container}`}>
        {/* Features Teaser */}
        <div className={`${spacing.section} text-center`}>
          <h2 className={`text-xl md:text-2xl font-semibold text-primary mb-4`}>
            Everything You Need for Peak Performance
          </h2>
          <p className={`${text.subtitle} text-foreground/80 ${width.content} mx-auto`}>
            Start with 3 free AI-generated workouts, then unlock unlimited access to our complete suite of training tools.
          </p>
        </div>

        {/* Enhanced Features Cards with Free vs Pro indicators */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Free Feature - Workout Generator */}
          <Card className="bg-card/40 backdrop-blur-sm border-border/50 hover:bg-card/60 transition-all duration-300 group cursor-pointer relative" onClick={() => navigate('/workout-generator')}>
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-green-100 text-green-800">3 FREE</Badge>
            </div>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">AI Workout Generator</h3>
              <p className="text-foreground/80">Generate personalized workouts based on your goals, fitness level, and available equipment.</p>
            </CardContent>
          </Card>

          {/* Pro Features */}
          <Card className="bg-card/40 backdrop-blur-sm border-border/50 hover:bg-card/60 transition-all duration-300 group cursor-pointer relative" onClick={() => navigate('/nutrition-diary')}>
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 flex items-center gap-1">
                <Crown className="h-3 w-3" />PRO
              </Badge>
            </div>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Apple className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Nutrition Diary</h3>
              <p className="text-foreground/80">Track your daily nutrition with real-time macro calculations and comprehensive food database.</p>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-sm border-border/50 hover:bg-card/60 transition-all duration-300 group cursor-pointer relative" onClick={() => navigate('/program-chat')}>
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 flex items-center gap-1">
                <Crown className="h-3 w-3" />PRO
              </Badge>
            </div>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Program Chat</h3>
              <p className="text-foreground/80">Chat with an AI coach about fitness, nutrition, and training strategies.</p>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-sm border-border/50 hover:bg-card/60 transition-all duration-300 group cursor-pointer relative" onClick={() => navigate('/movement-analysis')}>
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 flex items-center gap-1">
                <Crown className="h-3 w-3" />PRO
              </Badge>
            </div>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Movement Analysis</h3>
              <p className="text-foreground/80">Advanced video analysis for technique improvement and injury prevention.</p>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-sm border-border/50 hover:bg-card/60 transition-all duration-300 group cursor-pointer relative" onClick={() => navigate('/journal')}>
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 flex items-center gap-1">
                <Crown className="h-3 w-3" />PRO
              </Badge>
            </div>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Book className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Smart Journal</h3>
              <p className="text-foreground/80">Track your progress with intelligent insights and personalized recommendations.</p>
            </CardContent>
          </Card>

          <Card className="bg-card/40 backdrop-blur-sm border-border/50 hover:bg-card/60 transition-all duration-300 group cursor-pointer relative" onClick={() => navigate('/publish-program')}>
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 flex items-center gap-1">
                <Crown className="h-3 w-3" />PRO
              </Badge>
            </div>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Video className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">Publish Program</h3>
              <p className="text-foreground/80">Create and share professional workout videos with AI-generated scripts.</p>
            </CardContent>
          </Card>
        </div>

        {/* Upgrade CTA Section */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-8 text-center mb-12">
          <h2 className="text-2xl font-semibold text-amber-900 mb-3">
            Ready to Unlock Everything?
          </h2>
          <p className="text-amber-700 mb-4 max-w-2xl mx-auto">
            Start with 3 free workouts, then upgrade to Pro for just <strong>$25/month</strong> to access unlimited workout generation, nutrition tracking, AI coaching, and all advanced features.
          </p>
          <Button 
            onClick={() => navigate('/pricing')} 
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
          >
            <Crown className="h-5 w-5 mr-2" />
            View Pricing Plans
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
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
