
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ChatSubscriptionManagerProps {
  onMessageUpdate: () => void;
}

export const ChatSubscriptionManager = ({ onMessageUpdate }: ChatSubscriptionManagerProps) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('public:chat_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          onMessageUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, onMessageUpdate]);

  return null;
};
