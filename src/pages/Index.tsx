
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Video,
  MessageSquare,
  ArrowRight,
  BarChart,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { SectionContainer } from "@/components/layout/SectionContainer";
import { 
  animations, 
  spacing, 
  typography, 
  sizes, 
  colors, 
  transitions,
  responsive 
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const Index = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const cards = [
    {
      title: "Generate Program",
      description: "Create personalized workout programs with AI assistance",
      icon: Sparkles,
      path: "/workout-generator",
      requiresAuth: true,
      gradient: colors.gradients.sunset
    },
    {
      title: "Document Editor",
      description: "Create and edit workout documents with ease",
      icon: FileText,
      path: "/document-editor",
      requiresAuth: true,
      gradient: colors.gradients.success
    },
    {
      title: "Publish Program",
      description: "Record and publish your workout videos",
      icon: Video,
      path: "/publish-program",
      requiresAuth: true,
      gradient: colors.gradients.energy
    },
    {
      title: "Technique Analysis",
      description: "Analyze your workout technique",
      icon: BarChart,
      path: "/movement-analysis",
      requiresAuth: true,
      gradient: colors.gradients.premium
    },
    {
      title: "Program Chat",
      description: "Chat with AI about your workout program",
      icon: MessageSquare,
      path: "/program-chat",
      requiresAuth: true,
      gradient: colors.gradients.border
    },
    {
      title: "Previous Programs",
      description: "View your generated workout history",
      icon: FileText,
      path: "/generated-workouts",
      requiresAuth: true,
      gradient: colors.gradients.sunset
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
    <StandardPageLayout
      maxWidth="7xl"
      className="bg-gradient-to-br from-primary/5 via-background to-secondary/10"
    >
      <div className={spacing.section.default}>
        <motion.div
          {...animations.fadeIn}
          className={cn("text-center", spacing.margin.section)}
        >
          <h1 className={cn(
            typography.display.h1,
            "bg-gradient-to-r",
            colors.gradients.sunset,
            "bg-clip-text text-transparent"
          )}>
            STRENGTH.DESIGN
          </h1>
          <p className={cn(
            typography.responsive.subtitle,
            "mt-4 max-w-2xl mx-auto"
          )}>
            Your AI-powered fitness companion for personalized workout programs
          </p>
        </motion.div>

        <SectionContainer>
          <div className={cn(
            "grid",
            responsive.grid[3],
            spacing.gap.lg
          )}>
            {cards.map((card, index) => (
              <motion.div
                key={card.title}
                {...animations.slideUp}
                transition={{ delay: 0.1 * (index + 1) }}
                className="h-full"
              >
                <Card 
                  variant="interactive"
                  className={cn(
                    "h-full flex flex-col group",
                    transitions.default,
                    "hover:shadow-lg"
                  )}
                >
                  <CardHeader className={spacing.component.md}>
                    <div className={cn(
                      "flex items-center",
                      spacing.gap.sm,
                      spacing.margin.element
                    )}>
                      <div className={cn(
                        sizes.touch.iconButton,
                        "rounded-lg",
                        "bg-gradient-to-r",
                        card.gradient,
                        "flex items-center justify-center",
                        transitions.transform,
                        "group-hover:scale-110"
                      )}>
                        <card.icon className={cn(
                          sizes.icon.responsive.md,
                          "text-white"
                        )} />
                      </div>
                      <CardTitle className={typography.responsive.title}>
                        {card.title}
                      </CardTitle>
                    </div>
                    <CardDescription className={typography.body.default}>
                      {card.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className={cn(
                    spacing.component.md,
                    "pt-0 flex flex-col flex-grow"
                  )}>
                    <div className="mt-auto">
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full",
                          transitions.colors,
                          "group-hover:border-primary group-hover:text-primary"
                        )}
                        onClick={() => handleCardClick(card.path, card.requiresAuth)}
                      >
                        Get Started
                        <ArrowRight className={cn(
                          sizes.icon.sm,
                          "ml-2",
                          transitions.transform,
                          "group-hover:translate-x-1"
                        )} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </SectionContainer>
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
    </StandardPageLayout>
  );
};

export default Index;
