import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();
const db = getFirestore();

interface SendTestNotificationData {
  userId: string;
}

export const sendTestNotification = onCall({ cors: true }, async (request) => {
    const { userId } = request.data as SendTestNotificationData;

    // Validate input and permissions
    const requestUserId = request.auth?.uid;
    if (!requestUserId) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    if (!userId || userId !== requestUserId) {
      throw new HttpsError('permission-denied', 'Not authorized to send test notification');
    }

    try {
      // Get user's push token
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData?.pushToken) {
        throw new HttpsError('not-found', 'No push token found for user');
      }

      const pushToken = userData.pushToken;

      // Validate the push token
      if (!Expo.isExpoPushToken(pushToken)) {
        throw new HttpsError('invalid-argument', 'Invalid push token');
      }

      // Create test message
      const message: ExpoPushMessage = {
        to: pushToken,
        title: '🎯 Test Notification',
        body: 'Your push notifications are working perfectly! You\'re all set to receive workout reminders.',
        data: {
          type: 'test_notification',
          timestamp: new Date().toISOString(),
          deepLink: '/profile'
        },
        sound: 'default',
        badge: 1,
        channelId: 'default',
        priority: 'high'
      };

      // Send the notification
      const chunks = expo.chunkPushNotifications([message]);
      const tickets = [];

      for (const chunk of chunks) {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }

      // Check for errors
      const hasErrors = tickets.some(ticket => ticket.status === 'error');
      
      if (hasErrors) {
        const errorTickets = tickets.filter(ticket => ticket.status === 'error');
        console.error('Test notification failed:', errorTickets);
        throw new HttpsError('internal', 'Test notification failed to send');
      }

      // Store test notification record
      await db.collection('scheduledNotifications').add({
        userId,
        type: 'test_notification',
        title: '🎯 Test Notification',
        body: 'Your push notifications are working perfectly! You\'re all set to receive workout reminders.',
        data: {
          type: 'test_notification',
          timestamp: new Date().toISOString()
        },
        status: 'sent',
        sentAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        tickets
      });

      return {
        success: true,
        message: 'Test notification sent successfully!',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error in sendTestNotification:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError('internal', 'Failed to send test notification');
    }
});