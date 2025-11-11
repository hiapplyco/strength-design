import { 
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config';
import type { ChatSession, ChatMessage } from '../types';
import { COLLECTIONS } from '../types';

export class ChatService {
  /**
   * Create a new chat session
   */
  static async createChatSession(
    userId: string, 
    sessionType: ChatSession['sessionType']
  ): Promise<string> {
    try {
      const collectionRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.CHAT_SESSIONS);
      const session: Omit<ChatSession, 'id'> = {
        createdAt: serverTimestamp() as Timestamp,
        sessionType,
        startedAt: serverTimestamp() as Timestamp,
        endedAt: null,
        messageCount: 0,
        uploadedFiles: [],
        extractedProfileData: {},
        extractedNutritionData: {},
        extractedWorkoutData: {},
      };
      
      const docRef = await addDoc(collectionRef, session);
      return docRef.id;
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw error;
    }
  }

  /**
   * Get chat session
   */
  static async getChatSession(userId: string, sessionId: string): Promise<ChatSession | null> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.CHAT_SESSIONS, sessionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as ChatSession;
      }
      return null;
    } catch (error) {
      console.error('Error getting chat session:', error);
      throw error;
    }
  }

  /**
   * Get recent chat sessions
   */
  static async getRecentChatSessions(
    userId: string, 
    limitCount: number = 10
  ): Promise<ChatSession[]> {
    try {
      const collectionRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.CHAT_SESSIONS);
      const q = query(
        collectionRef,
        orderBy('startedAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatSession[];
    } catch (error) {
      console.error('Error getting recent chat sessions:', error);
      throw error;
    }
  }

  /**
   * Add message to chat session
   */
  static async addMessage(
    userId: string,
    sessionId: string,
    message: Omit<ChatMessage, 'id' | 'createdAt'>
  ): Promise<string> {
    try {
      const collectionRef = collection(
        db,
        COLLECTIONS.USERS,
        userId,
        COLLECTIONS.CHAT_SESSIONS,
        sessionId,
        COLLECTIONS.MESSAGES
      );
      
      const docRef = await addDoc(collectionRef, {
        ...message,
        createdAt: serverTimestamp(),
      });
      
      // Update message count in session
      const sessionRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.CHAT_SESSIONS, sessionId);
      const session = await getDoc(sessionRef);
      if (session.exists()) {
        await updateDoc(sessionRef, {
          messageCount: (session.data().messageCount || 0) + 1,
        });
      }
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a chat session
   */
  static async getSessionMessages(
    userId: string,
    sessionId: string,
    limitCount: number = 50
  ): Promise<ChatMessage[]> {
    try {
      const collectionRef = collection(
        db,
        COLLECTIONS.USERS,
        userId,
        COLLECTIONS.CHAT_SESSIONS,
        sessionId,
        COLLECTIONS.MESSAGES
      );
      
      const q = query(
        collectionRef,
        orderBy('createdAt', 'asc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
    } catch (error) {
      console.error('Error getting session messages:', error);
      throw error;
    }
  }

  /**
   * Update message response
   */
  static async updateMessageResponse(
    userId: string,
    sessionId: string,
    messageId: string,
    response: string,
    metadata?: {
      tokensUsed?: number;
      modelUsed?: string;
      extractedData?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const docRef = doc(
        db,
        COLLECTIONS.USERS,
        userId,
        COLLECTIONS.CHAT_SESSIONS,
        sessionId,
        COLLECTIONS.MESSAGES,
        messageId
      );
      
      await updateDoc(docRef, {
        response,
        ...metadata,
      });
    } catch (error) {
      console.error('Error updating message response:', error);
      throw error;
    }
  }

  /**
   * End chat session
   */
  static async endChatSession(
    userId: string,
    sessionId: string,
    summary?: {
      aiSummary?: string;
      keyInsights?: string[];
      extractedData?: {
        profile?: Record<string, any>;
        nutrition?: Record<string, any>;
        workout?: Record<string, any>;
      };
    }
  ): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.CHAT_SESSIONS, sessionId);
      
      const updateData: any = {
        endedAt: serverTimestamp(),
      };
      
      if (summary) {
        if (summary.aiSummary) updateData.aiSummary = summary.aiSummary;
        if (summary.keyInsights) updateData.keyInsights = summary.keyInsights;
        if (summary.extractedData?.profile) {
          updateData.extractedProfileData = summary.extractedData.profile;
        }
        if (summary.extractedData?.nutrition) {
          updateData.extractedNutritionData = summary.extractedData.nutrition;
        }
        if (summary.extractedData?.workout) {
          updateData.extractedWorkoutData = summary.extractedData.workout;
        }
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error ending chat session:', error);
      throw error;
    }
  }

  /**
   * Search messages across all sessions
   */
  static async searchMessages(
    userId: string,
    searchTerm: string,
    limitCount: number = 20
  ): Promise<{ session: ChatSession; message: ChatMessage }[]> {
    try {
      const results: { session: ChatSession; message: ChatMessage }[] = [];
      
      // Get recent sessions
      const sessions = await this.getRecentChatSessions(userId, 10);
      
      // Search messages in each session
      for (const session of sessions) {
        const messages = await this.getSessionMessages(userId, session.id!);
        
        const matchingMessages = messages.filter(msg => 
          msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (msg.response && msg.response.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        
        matchingMessages.forEach(msg => {
          results.push({ session, message: msg });
        });
        
        if (results.length >= limitCount) break;
      }
      
      return results.slice(0, limitCount);
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }

  /**
   * Get chat statistics
   */
  static async getChatStats(userId: string): Promise<{
    totalSessions: number;
    totalMessages: number;
    sessionsByType: Record<string, number>;
    averageMessagesPerSession: number;
  }> {
    try {
      const sessionsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.CHAT_SESSIONS);
      const sessionsSnapshot = await getDocs(sessionsRef);
      
      let totalMessages = 0;
      const sessionsByType: Record<string, number> = {
        workout: 0,
        nutrition: 0,
        wellness: 0,
        general: 0,
      };
      
      sessionsSnapshot.forEach(doc => {
        const session = doc.data() as ChatSession;
        totalMessages += session.messageCount || 0;
        if (session.sessionType) {
          sessionsByType[session.sessionType] = (sessionsByType[session.sessionType] || 0) + 1;
        }
      });
      
      const totalSessions = sessionsSnapshot.size;
      const averageMessagesPerSession = totalSessions > 0 ? totalMessages / totalSessions : 0;
      
      return {
        totalSessions,
        totalMessages,
        sessionsByType,
        averageMessagesPerSession: Math.round(averageMessagesPerSession),
      };
    } catch (error) {
      console.error('Error getting chat stats:', error);
      throw error;
    }
  }
}