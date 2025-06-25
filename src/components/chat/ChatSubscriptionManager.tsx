
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ChatSubscriptionManagerProps {
  onMessageUpdate: () => void;
}

export const ChatSubscriptionManager = ({ onMessageUpdate }: ChatSubscriptionManagerProps) => {
  const { user } = useAuth();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;
    
    // Clean up existing subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }
    
    subscriptionRef.current = supabase
      .channel(`chat_messages_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Chat subscription received change:', payload);
          // Only trigger update for response updates, not initial message saves
          if (payload.eventType === 'UPDATE' && payload.new.response) {
            onMessageUpdate();
          }
        }
      )
      .subscribe((status) => {
        console.log('Chat subscription status:', status);
      });

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user, onMessageUpdate]);

  return null;
};
