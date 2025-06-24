
import { Card } from "@/components/ui/card";
import { ChatHeader } from "./ChatHeader";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ChatSubscriptionManager } from "./ChatSubscriptionManager";
import { useEnhancedChatMessages } from "@/hooks/useEnhancedChatMessages";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Database, TrendingUp, Calendar, Heart } from "lucide-react";

export const EnhancedChatContainer = () => {
  const {
    messages,
    isLoading,
    fetchMessages,
    handleSendMessage,
    deleteAllMessages,
    startNewChat,
    userDataSummary,
    hasUserData
  } = useEnhancedChatMessages();

  const { isLoading: fileLoading, handleFileSelect } = useFileUpload();

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return (
    <Card className="h-full w-full max-w-4xl mx-auto overflow-hidden border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col h-full">
        <ChatSubscriptionManager onMessageUpdate={fetchMessages} />
        
        {/* Enhanced Header with Data Integration Status */}
        <div className="border-b border-border/50 bg-gradient-to-r from-background via-background to-muted/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AI Personal Coach
            </h2>
            <div className="flex gap-2">
              <ChatHeader onNewChat={startNewChat} onDeleteChat={deleteAllMessages} />
            </div>
          </div>
          
          {/* Data Integration Status */}
          <div className="flex flex-wrap gap-2">
            {hasUserData ? (
              <>
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  Full Data Access
                </Badge>
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
          
          <p className="text-xs text-muted-foreground mt-2">
            Your AI coach has access to your complete fitness journey - workouts, nutrition, wellness data, and progress trends for personalized advice.
          </p>
        </div>

        <ChatMessages messages={messages} />
        <ChatInput 
          onSendMessage={handleSendMessage}
          onFileSelect={handleFileSelect}
          isLoading={isLoading || fileLoading}
        />
      </div>
    </Card>
  );
};
