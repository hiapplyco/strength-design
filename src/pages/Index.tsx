
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

const Index = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

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
      icon: <Dumbbell className="h-6 w-6" />,
      path: "/workout-generator",
    },
    {
      title: "Document Editor",
      description: "Create and edit workout documents with ease",
      icon: <FileText className="h-6 w-6" />,
      path: "/document-editor",
    },
    {
      title: "Video Analysis",
      description: "Record and analyze your workout videos",
      icon: <Video className="h-6 w-6" />,
      path: "/video-analysis",
    },
    {
      title: "Program Chat",
      description: "Chat with AI about your workout program",
      icon: <MessageSquare className="h-6 w-6" />,
      path: "/program-chat",
    },
    {
      title: "Generated Workouts",
      description: "View your generated workout history",
      icon: <BarChart className="h-6 w-6" />,
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
      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6"
          >
            Welcome to strength.design
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-200 max-w-2xl mx-auto"
          >
            Your all-in-one platform for AI-powered workout programming and analysis
          </motion.p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
            >
              <Card className="bg-black/20 border-primary/20 backdrop-blur-sm hover:bg-black/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-primary">
                    {card.icon}
                    {card.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 mb-4">{card.description}</p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(card.path)}
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
    </div>
  );
};

export default Index;

