
import React, { useState, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ModernInputCardProps {
  icon: ReactNode;
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  hasContent: boolean;
  preview?: string;
  children: ReactNode;
  className?: string;
}

export const ModernInputCard: React.FC<ModernInputCardProps> = ({
  icon,
  title,
  isExpanded,
  onToggle,
  hasContent,
  preview,
  children,
  className
}) => {
  return (
    <Card className={cn(
      "group transition-all duration-300 border-2",
      hasContent 
        ? "border-green-500/30 bg-green-500/5 shadow-lg shadow-green-500/10" 
        : "border-border/30 hover:border-green-500/20",
      "hover:shadow-md",
      className
    )}>
      <CardHeader 
        className="cursor-pointer select-none p-4"
        onClick={onToggle}
      >
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              hasContent ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
            )}>
              {icon}
            </div>
            <span className="text-foreground">{title}</span>
            {hasContent && (
              <MessageSquare className="h-4 w-4 text-green-400 opacity-70" />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {preview && !isExpanded && (
              <Badge variant="secondary" className="text-xs font-normal bg-green-500/10 text-green-400 border-green-500/20">
                {preview}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 transition-all duration-200",
                hasContent ? "text-green-400 hover:bg-green-500/20" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isExpanded ? (
                <Minus className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0 pb-4 px-4">
              <div className="border-t border-border/30 pt-4">
                {children}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
