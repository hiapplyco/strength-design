import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

const expo = new Expo();
const db = getFirestore();

interface SendNotificationData {
  userId: string;
  title: string;
  body: string;
  type?: string;
  data?: Record<string, any>;
}

export const sendPushNotification = onCall({ cors: true }, async (request) => {
  const { userId, title, body, type, data } = request.data as SendNotificationData;

  // Validate input
  if (!userId || !title || !body) {
    throw new HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    // Get user's push token from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData?.pushToken) {
      console.log(`No push token found for user ${userId}`);
      return { success: false, error: 'No push token found' };
    }

    const pushToken = userData.pushToken;

    // Validate the push token
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Invalid Expo push token: ${pushToken}`);
      return { success: false, error: 'Invalid push token' };
    }

    // Create the message
    const message: ExpoPushMessage = {
      to: pushToken,
      title,
      body,
      data: {
        type: type || 'general',
        ...data
      },
      sound: 'default',
      badge: 1,
      channelId: 'default',
      priority: 'high'
    };

    // Send the notification
    const chunks = expo.chunkPushNotifications([message]);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }

    // Check for errors in tickets
    const hasErrors = tickets.some(ticket => ticket.status === 'error');
    
    if (hasErrors) {
      console.error('Some notifications failed to send:', tickets);
    }

    // Store notification in Firestore for tracking
    await db.collection('scheduledNotifications').add({
      userId,
      type: type || 'general',
      title,
      body,
      data: data || {},
      status: hasErrors ? 'failed' : 'sent',
      sentAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      tickets
    });

    return { 
      success: !hasErrors, 
      tickets,
      message: hasErrors ? 'Some notifications failed' : 'Notification sent successfully'
    };

  } catch (error) {
    console.error('Error in sendPushNotification:', error);
    
    // Store failed notification attempt
    try {
      await db.collection('scheduledNotifications').add({
        userId,
        type: type || 'general',
        title,
        body,
        data: data || {},
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (dbError) {
      console.error('Error storing failed notification:', dbError);
    }

    throw new HttpsError('internal', 'Failed to send notification');
  }
});