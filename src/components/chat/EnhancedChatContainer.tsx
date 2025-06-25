
import { Card } from "@/components/ui/card";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ChatSubscriptionManager } from "./ChatSubscriptionManager";
import { useEnhancedChatMessages } from "@/hooks/useEnhancedChatMessages";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Database, TrendingUp, Calendar, Heart, MessageSquare, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { spacing, typography, variants } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export const EnhancedChatContainer = () => {
  const {
    messages,
    isLoading,
    fetchMessages,
    handleSendMessage,
    deleteAllMessages,
    startNewChat,
    userDataSummary,
    hasUserData,
    workoutTemplates,
    isInitialized
  } = useEnhancedChatMessages();

  const { isLoading: fileLoading, handleFileSelect } = useFileUpload();
  const mountedRef = useRef(false);

  // Only fetch messages once on mount, and only if we haven't initialized yet
  useEffect(() => {
    if (!mountedRef.current && !isInitialized) {
      mountedRef.current = true;
      fetchMessages();
    }
  }, [fetchMessages, isInitialized]);

  const handleNewChat = () => {
    startNewChat();
    // Reset mounted flag to allow fresh initialization
    mountedRef.current = false;
  };

  const handleDeleteChat = () => {
    deleteAllMessages();
    // Reset mounted flag to allow fresh initialization
    mountedRef.current = false;
  };

  return (
    <Card 
      variant="flat" 
      className={cn(
        "h-full w-full max-w-4xl mx-auto overflow-hidden",
        "flex flex-col bg-card"
      )}
    >
      <ChatSubscriptionManager onMessageUpdate={fetchMessages} />
      
      {/* Unified Header */}
      <div className={cn(
        "border-b border-border",
        spacing.component.md,
        "bg-card"
      )}>
        {/* Main Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h1 className={cn(typography.display.h5, "text-foreground")}>AI Personal Coach</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleNewChat}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-1" />
              New Chat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={handleDeleteChat}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Chat
            </Button>
          </div>
        </div>
        
        {/* Data Integration Status */}
        <div className="flex flex-wrap gap-2 mb-3">
          {hasUserData ? (
            <>
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <Database className="h-3 w-3" />
                Full Data Access
              </Badge>
              {workoutTemplates?.length > 0 && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Dumbbell className="h-3 w-3" />
                  {workoutTemplates.length} Workout Templates
                </Badge>
              )}
              {userDataSummary?.workoutSessions.length > 0 && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {userDataSummary.workoutSessions.length} Recent Workouts
                </Badge>
              )}
              {userDataSummary?.nutritionLogs.length > 0 && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {userDataSummary.nutritionLogs.length} Days Nutrition
                </Badge>
              )}
              {userDataSummary?.journalEntries.length > 0 && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {userDataSummary.journalEntries.length} Wellness Entries
                </Badge>
              )}
            </>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Loading your fitness profile...
            </Badge>
          )}
        </div>
        
        <p className={cn(typography.caption, "text-muted-foreground")}>
          Your AI coach has access to your complete fitness journey - workouts, nutrition, wellness data, workout templates, and progress trends for personalized advice.
          {workoutTemplates?.length > 0 && ` Ask about your ${workoutTemplates.length} generated workout templates!`}
        </p>
      </div>

      <ChatMessages messages={messages} />
      <ChatInput 
        onSendMessage={handleSendMessage}
        onFileSelect={handleFileSelect}
        isLoading={isLoading || fileLoading}
      />
    </Card>
  );
};
