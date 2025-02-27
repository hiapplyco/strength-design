
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  FileText,
  Video,
  MessageSquare,
  ArrowRight,
  Dumbbell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (session) {
      navigate("/workout-generator", { replace: true });
    }
  }, [session, navigate]);

  if (session) return null;

  const cards = [
    {
      title: "Workout Generator",
      description: "Create personalized workout programs with AI assistance",
      icon: <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6" />,
      path: "/workout-generator",
    },
    {
      title: "Document Editor",
      description: "Create and edit workout documents with ease",
      icon: <FileText className="h-5 w-5 sm:h-6 sm:w-6" />,
      path: "/document-editor",
    },
    {
      title: "Video Analysis",
      description: "Record and analyze your workout videos",
      icon: <Video className="h-5 w-5 sm:h-6 sm:w-6" />,
      path: "/video-analysis",
    },
    {
      title: "Program Chat",
      description: "Chat with AI about your workout program",
      icon: <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />,
      path: "/program-chat",
    },
    {
      title: "Generated Workouts",
      description: "View your generated workout history",
      icon: <BarChart className="h-5 w-5 sm:h-6 sm:w-6" />,
      path: "/generated-workouts",
    },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Background image */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url("/lovable-uploads/08e5da43-23c6-459a-bea3-16ae71e6ceb5.png")',
        }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-3 sm:px-4 py-6 sm:py-12">
        {/* Welcome Section */}
        <div className="text-center mb-8 sm:mb-16">
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
            className="text-base sm:text-lg md:text-xl text-gray-200 max-w-2xl mx-auto px-2"
          >
            Your all-in-one platform for AI-powered workout programming and analysis
          </motion.p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
            >
              <Card className="bg-black/20 border-primary/20 backdrop-blur-sm hover:bg-black/30 transition-all duration-300">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center gap-2 sm:gap-3 text-primary text-base sm:text-xl">
                    {card.icon}
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                  <p className="text-gray-300 mb-3 sm:mb-4 text-sm sm:text-base">{card.description}</p>
                  <Button
                    variant="outline"
                    className="w-full text-sm sm:text-base py-1 sm:py-2"
                    onClick={() => navigate(card.path)}
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
    </div>
  );
};

export default Index;
