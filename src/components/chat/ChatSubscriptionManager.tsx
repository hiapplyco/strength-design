
import { useEffect, useRef } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, Unsubscribe } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

interface ChatSubscriptionManagerProps {
  onMessageUpdate: () => void;
}

export const ChatSubscriptionManager = ({ onMessageUpdate }: ChatSubscriptionManagerProps) => {
  const { user } = useAuth();
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const isSubscribedRef = useRef(false);
  const previousMessagesRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    if (!user || isSubscribedRef.current) return;

    // Clean up existing subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      isSubscribedRef.current = false;
      previousMessagesRef.current.clear();
    }

    console.log('Setting up chat subscription for user:', user.uid);

    const messagesRef = collection(db, 'chat_messages');
    const q = query(messagesRef, where('user_id', '==', user.uid));

    unsubscribeRef.current = onSnapshot(
      q,
      (snapshot) => {
        console.log('Chat subscription received changes:', snapshot.docChanges().length);

        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const newData = change.doc.data();
            const previousData = previousMessagesRef.current.get(change.doc.id);

            // Only trigger update for response updates, not initial message saves
            if (newData.response && (!previousData || !previousData.response)) {
              console.log('Triggering message update for new response');
              onMessageUpdate();
            }

            // Store current state for next comparison
            previousMessagesRef.current.set(change.doc.id, newData);
          }
        });

        isSubscribedRef.current = true;
      },
      (error) => {
        console.error('Chat subscription error:', error);
        isSubscribedRef.current = false;
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        console.log('Cleaning up chat subscription');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
        isSubscribedRef.current = false;
        previousMessagesRef.current.clear();
      }
    };
  }, [user, onMessageUpdate]);

  return null;
};
