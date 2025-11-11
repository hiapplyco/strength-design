import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const db = getFirestore();

interface CancelAllNotificationsData {
  userId: string;
}

export const cancelAllUserNotifications = onCall({ cors: true }, async (request) => {
    const { userId } = request.data as CancelAllNotificationsData;

    // Validate input and permissions
    const requestUserId = request.auth?.uid;
    if (!requestUserId) {
      throw new HttpsError('unauthenticated', 'User must be authenticated');
    }

    if (!userId || userId !== requestUserId) {
      throw new HttpsError('permission-denied', 'Not authorized to cancel these notifications');
    }

    try {
      // Get all scheduled notifications for the user
      const scheduledQuery = await db
        .collection('scheduledNotifications')
        .where('userId', '==', userId)
        .where('status', '==', 'scheduled')
        .get();

      if (scheduledQuery.empty) {
        return {
          success: true,
          message: 'No scheduled notifications to cancel',
          cancelledCount: 0
        };
      }

      // Cancel all notifications in batches (Firestore batch limit is 500)
      const batchSize = 500;
      const batches = [];
      let currentBatch = db.batch();
      let operationCount = 0;

      scheduledQuery.docs.forEach(doc => {
        if (operationCount === batchSize) {
          batches.push(currentBatch);
          currentBatch = db.batch();
          operationCount = 0;
        }

        currentBatch.update(doc.ref, {
          status: 'cancelled',
          cancelledAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        
        operationCount++;
      });

      // Add the last batch if it has operations
      if (operationCount > 0) {
        batches.push(currentBatch);
      }

      // Execute all batches
      await Promise.all(batches.map(batch => batch.commit()));

      return {
        success: true,
        message: `Successfully cancelled ${scheduledQuery.docs.length} notifications`,
        cancelledCount: scheduledQuery.docs.length
      };

    } catch (error) {
      console.error('Error in cancelAllUserNotifications:', error);
      throw new HttpsError('internal', 'Failed to cancel notifications');
    }
});