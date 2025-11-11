import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/firebase/useAuth';
import { JournalEntry } from '@/lib/firebase/db/types';

type JournalEntryInsert = Omit<JournalEntry, 'id' | 'created_at' | 'updated_at'>;
type JournalEntryUpdate = Partial<JournalEntryInsert>;

export const useJournalEntries = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const createEntry = async (entry: JournalEntryInsert): Promise<JournalEntry | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create journal entries",
        variant: "destructive"
      });
      return null;
    }

    try {
      const docRef = await addDoc(collection(db, `users/${user.uid}/journal_entries`), {
        ...entry,
        user_id: user.uid,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      toast({
        title: "Success",
        description: "Journal entry created successfully"
      });
      
      return {
        ...entry,
        id: docRef.id,
        user_id: user.uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as JournalEntry;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      toast({
        title: "Error",
        description: "Failed to create journal entry",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateEntry = async (id: string, updates: JournalEntryUpdate): Promise<boolean> => {
    if (!user) return false;

    try {
      const entryRef = doc(db, `users/${user.uid}/journal_entries`, id);
      await updateDoc(entryRef, {
        ...updates,
        updated_at: serverTimestamp()
      });
      
      toast({
        title: "Success",
        description: "Journal entry updated successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Error updating journal entry:', error);
      toast({
        title: "Error",
        description: "Failed to update journal entry",
        variant: "destructive"
      });
      return false;
    }
  };

  const deleteEntry = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      await deleteDoc(doc(db, `users/${user.uid}/journal_entries`, id));
      
      toast({
        title: "Success",
        description: "Journal entry deleted successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete journal entry",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, `users/${user.uid}/journal_entries`),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const entriesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as JournalEntry));
        
        setEntries(entriesData);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching journal entries:', error);
        toast({
          title: "Error",
          description: "Failed to load journal entries",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, toast]);

  return {
    entries,
    isLoading,
    createEntry,
    updateEntry,
    deleteEntry,
    refetch: () => {} // Real-time updates handle this automatically
  };
};