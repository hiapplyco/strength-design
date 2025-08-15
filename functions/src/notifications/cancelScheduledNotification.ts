import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const db = getFirestore();

interface CancelNotificationData {
  notificationId: string;
}

export const cancelScheduledNotification = onCall({ cors: true }, async (request) => {
    const { notificationId } = request.data as CancelNotificationData;

    // Validate input
    if (!notificationId) {
      throw new HttpsError('invalid-argument', 'Missing notification ID');
    }

    try {
      // Get the notification document
      const notificationDoc = await db.collection('scheduledNotifications').doc(notificationId).get();

      if (!notificationDoc.exists) {
        throw new HttpsError('not-found', 'Notification not found');
      }

      const notificationData = notificationDoc.data();
      
      // Verify the user owns this notification (security check)
      const userId = request.auth?.uid;
      if (!userId || notificationData?.userId !== userId) {
        throw new HttpsError('permission-denied', 'Not authorized to cancel this notification');
      }

      // Update the notification status to cancelled
      await db.collection('scheduledNotifications').doc(notificationId).update({
        status: 'cancelled',
        cancelledAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      return {
        success: true,
        message: 'Notification cancelled successfully'
      };

    } catch (error) {
      console.error('Error in cancelScheduledNotification:', error);
      
      if (error instanceof HttpsError) {
        throw error;
      }
      
      throw new HttpsError('internal', 'Failed to cancel notification');
    }
});