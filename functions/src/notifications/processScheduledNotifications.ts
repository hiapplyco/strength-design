import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

const db = getFirestore();
const expo = new Expo();

// This function runs every minute to check for notifications that need to be sent
export const processScheduledNotifications = onSchedule('* * * * *', async (event) => {
  console.log('Processing scheduled notifications...');

  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes buffer
    const oneMinuteFromNow = new Date(now.getTime() + 1 * 60 * 1000); // 1 minute ahead buffer

    // Query for notifications that should be sent now
    const notificationsQuery = await db
      .collection('scheduledNotifications')
      .where('status', '==', 'scheduled')
      .where('scheduledFor', '>=', Timestamp.fromDate(fiveMinutesAgo))
      .where('scheduledFor', '<=', Timestamp.fromDate(oneMinuteFromNow))
      .limit(100) // Process max 100 notifications per run
      .get();

    if (notificationsQuery.empty) {
      console.log('No notifications to process');
      return;
    }

    console.log(`Processing ${notificationsQuery.docs.length} notifications`);

    // Group notifications by user to get push tokens
    const userIds = [...new Set(notificationsQuery.docs.map(doc => doc.data().userId))];
    const userTokens: Record<string, string> = {};

    // Batch get user push tokens
    const userPromises = userIds.map(async (userId) => {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      if (userData?.pushToken && Expo.isExpoPushToken(userData.pushToken)) {
        userTokens[userId] = userData.pushToken;
      }
    });

    await Promise.all(userPromises);

    // Prepare messages for sending
    const messages: ExpoPushMessage[] = [];
    const notificationUpdates: { docId: string; userId: string; hasToken: boolean }[] = [];

    notificationsQuery.docs.forEach(doc => {
      const data = doc.data();
      const userId = data.userId;
      const pushToken = userTokens[userId];

      notificationUpdates.push({
        docId: doc.id,
        userId,
        hasToken: !!pushToken
      });

      if (pushToken) {
        messages.push({
          to: pushToken,
          title: data.title,
          body: data.body,
          data: data.data || {},
          sound: 'default',
          badge: 1,
          channelId: 'default',
          priority: 'high'
        });
      }
    });

    // Send notifications in chunks
    const tickets: ExpoPushTicket[] = [];
    const chunks = expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending notification chunk:', error);
        // Create error tickets for failed chunks
        chunk.forEach(() => {
          tickets.push({
            status: 'error',
            message: 'Failed to send notification chunk'
          });
        });
      }
    }

    // Update notification statuses in Firestore
    const batch = db.batch();
    let messageIndex = 0;

    notificationUpdates.forEach((update, index) => {
      const docRef = db.collection('scheduledNotifications').doc(update.docId);
      const updateData: any = {
        updatedAt: Timestamp.now()
      };

      if (!update.hasToken) {
        // No push token available
        updateData.status = 'failed';
        updateData.error = 'No push token available';
      } else {
        // Check ticket status
        const ticket = tickets[messageIndex];
        messageIndex++;

        if (ticket && ticket.status === 'ok') {
          updateData.status = 'sent';
          updateData.sentAt = Timestamp.now();
          updateData.ticketId = ticket.id;
        } else {
          updateData.status = 'failed';
          updateData.error = ticket?.message || 'Unknown error';
          updateData.ticketDetails = ticket?.details;
        }
      }

      batch.update(docRef, updateData);
    });

    await batch.commit();

    console.log(`Processed ${notificationUpdates.length} notifications`);
    console.log(`Sent ${tickets.filter(t => t.status === 'ok').length} successfully`);
    console.log(`Failed ${tickets.filter(t => t.status === 'error').length} notifications`);

  } catch (error) {
    console.error('Error in processScheduledNotifications:', error);
    throw error;
  }
});