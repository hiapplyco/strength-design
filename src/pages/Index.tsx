
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
      setShowAuthDialog(true);
    } else {
      navigate(path);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/50 via-purple-900/50 to-pink-900/50 opacity-50 pointer-events-none"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-12 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <LogoHeader className="text-white">STRENGTH.DESIGN</LogoHeader>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
            >
              <Card 
                className="bg-black/50 border border-green-500/30 backdrop-blur-sm 
                           hover:border-green-500/50 transition-all duration-300 
                           bg-gradient-to-br from-green-900/20 via-purple-900/20 to-pink-900/20 
                           hover:from-green-900/30 hover:via-purple-900/30 hover:to-pink-900/30"
              >
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-white">
                    {card.icon}
                    <span className="text-lg">{card.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-white/70 mb-4 text-sm">{card.description}</p>
                  <Button
                    variant="outline"
                    className="w-full bg-black/50 border-green-500/30 text-white 
                               hover:bg-green-500/10 hover:border-green-500/50"
                    onClick={() => handleCardClick(card.path, card.requiresAuth)}
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
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
