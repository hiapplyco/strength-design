
import React, { useState } from "react";
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
import { AuthDialog } from "@/components/auth/AuthDialog";
import { LogoHeader } from "@/components/ui/logo-header";
import { useTheme } from "@/contexts/ThemeContext";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const Index = () => {
  const { session } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { open, openMobile } = useSidebar();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const isOpen = isMobile ? openMobile : open;

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
      description: "Record and publish your workout videos",
      icon: <Video className="h-5 w-5 sm:h-6 sm:w-6" />,
      path: "/publish-program",
      requiresAuth: true
    },
    {
      title: "Technique Analysis",
      description: "Analyze your workout technique",
      icon: <BarChart className="h-5 w-5 sm:h-6 sm:w-6" />,
      path: "/movement-analysis",
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
      setShowAuthDialog(true);
    } else {
      navigate(path);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Apply different gradient overlay based on theme */}
      <div className={`absolute inset-0 ${
        theme === 'light' 
          ? 'bg-gradient-to-br from-primary/5 via-background to-secondary/10' 
          : 'bg-gradient-to-br from-primary/10 via-primary/5 to-background'
      } opacity-50 pointer-events-none`}></div>
      
      <div className="relative z-10 container mx-auto px-4 py-12 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <LogoHeader>STRENGTH.DESIGN</LogoHeader>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
              className="h-full"
            >
              <Card 
                className={`border backdrop-blur-sm transition-all duration-300 h-full flex flex-col
                           ${theme === 'light' 
                             ? 'bg-card/80 border-primary/20 hover:border-primary/40' 
                             : 'bg-card/50 border-primary/30 hover:border-primary/50'}`}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-foreground">
                    {card.icon}
                    <span className="text-lg">{card.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 flex flex-col flex-grow">
                  <p className="text-muted-foreground mb-6 text-sm h-16">{card.description}</p>
                  <div className="mt-auto">
                    <Button
                      variant="outline"
                      className={`w-full ${theme === 'light' 
                        ? 'border-primary/20 hover:bg-primary/10 hover:border-primary/40' 
                        : 'border-primary/30 hover:bg-primary/10 hover:border-primary/50'}`}
                      onClick={() => handleCardClick(card.path, card.requiresAuth)}
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <AuthDialog
        isOpen={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onSuccess={() => {
          setShowAuthDialog(false);
          const activePath = cards.find(card => card.requiresAuth)?.path || "/workout-generator";
          navigate(activePath);
        }}
      />
    </div>
  );
};

export default Index;
