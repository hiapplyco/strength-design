
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Video,
  MessageSquare,
  ArrowRight,
  Dumbbell,
  BarChart,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { StyledLogo } from "@/components/ui/styled-logo";

const Index = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const cards = [
    {
      title: "Generate Program",
      description: "Create personalized workout programs with AI assistance",
      icon: <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />,
      path: "/workout-generator",
      requiresAuth: true
    },
    {
      title: "Document Editor",
      description: "Create and edit workout documents with ease",
      icon: <FileText className="h-5 w-5 sm:h-6 sm:w-6" />,
      path: "/document-editor",
      requiresAuth: true
    },
    {
      title: "Publish Program",
      description: "Record and analyze your workout videos",
      icon: <Video className="h-5 w-5 sm:h-6 sm:w-6" />,
      path: "/video-analysis",
      requiresAuth: true
    },
    {
      title: "Technique Analysis",
      description: "Analyze your workout technique",
      icon: <BarChart className="h-5 w-5 sm:h-6 sm:w-6" />,
      path: "/technique-analysis",
      requiresAuth: true
    },
    {
      title: "Program Chat",
      description: "Chat with AI about your workout program",
      icon: <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />,
      path: "/program-chat",
      requiresAuth: true
    },
    {
      title: "Previous Programs",
      description: "View your generated workout history",
      icon: <FileText className="h-5 w-5 sm:h-6 sm:w-6" />,
      path: "/generated-workouts",
      requiresAuth: true
    },
  ];

  const handleCardClick = (path: string, requiresAuth: boolean) => {
    if (requiresAuth && !session) {
      // Show auth dialog if authentication is required but user is not logged in
      setShowAuthDialog(true);
    } else {
      navigate(path);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Background image */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url("/lovable-uploads/08e5da43-23c6-459a-bea3-16ae71e6ceb5.png")',
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-3 sm:px-6 py-8 sm:py-12 max-w-7xl">
        {/* Welcome Section */}
        <div className="text-center mb-8 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <StyledLogo size="large" className="mb-2" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6"
          >
            Welcome to strength.design
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-gray-200 max-w-3xl mx-auto px-2 sm:px-4"
          >
            Your all-in-one platform for AI-powered workout programming and analysis
          </motion.p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
              className="w-full"
            >
              <Card className="bg-black/20 border-primary/20 backdrop-blur-sm hover:bg-black/30 transition-all duration-300 h-full">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center gap-2 sm:gap-3 text-primary text-base sm:text-xl">
                    {card.icon}
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">{card.description}</p>
                  <Button
                    variant="outline"
                    className="w-full text-sm sm:text-base py-1.5 sm:py-2"
                    onClick={() => handleCardClick(card.path, card.requiresAuth)}
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Auth Dialog */}
      <AuthDialog
        isOpen={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={() => {
          setShowAuthDialog(false);
          // Navigate to the previously selected path after successful authentication
          const activePath = cards.find(card => card.requiresAuth)?.path || "/workout-generator";
          navigate(activePath);
        }}
      />
    </div>
  );
};

export default Index;
