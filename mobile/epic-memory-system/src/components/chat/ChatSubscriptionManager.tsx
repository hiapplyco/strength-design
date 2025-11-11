
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ChatSubscriptionManagerProps {
  onMessageUpdate: () => void;
}

export const ChatSubscriptionManager = ({ onMessageUpdate }: ChatSubscriptionManagerProps) => {
  const { user } = useAuth();
  const subscriptionRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    if (!user || isSubscribedRef.current) return;
    
    // Clean up existing subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
      isSubscribedRef.current = false;
    }
    
    console.log('Setting up chat subscription for user:', user.id);
    
    subscriptionRef.current = supabase
      .channel(`chat_messages_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Chat subscription received UPDATE:', payload);
          // Only trigger update for response updates, not initial message saves
          if (payload.new.response && !payload.old.response) {
            console.log('Triggering message update for new response');
            onMessageUpdate();
          }
        }
      )
      .subscribe((status) => {
        console.log('Chat subscription status:', status);
        if (status === 'SUBSCRIBED') {
          isSubscribedRef.current = true;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          isSubscribedRef.current = false;
        }
      });

    return () => {
      if (subscriptionRef.current) {
        console.log('Cleaning up chat subscription');
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
        isSubscribedRef.current = false;
      }
    };
  }, [user, onMessageUpdate]);

  return null;
};
