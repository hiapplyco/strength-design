import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const db = getFirestore();

interface ScheduleWorkoutReminderData {
  userId: string;
  workoutId: string;
  workoutTitle: string;
  scheduledDate: string; // ISO string
  reminderTypes: ('same_day' | 'day_before' | 'two_days' | 'week_before')[];
}

export const scheduleWorkoutReminder = onCall({ cors: true }, async (request) => {
    const { 
      userId, 
      workoutId, 
      workoutTitle, 
      scheduledDate, 
      reminderTypes 
    } = request.data as ScheduleWorkoutReminderData;

    // Validate input
    if (!userId || !workoutId || !workoutTitle || !scheduledDate) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    const workoutDateTime = new Date(scheduledDate);
    if (isNaN(workoutDateTime.getTime())) {
      throw new HttpsError('invalid-argument', 'Invalid scheduled date');
    }

    try {
      // Get user's notification preferences
      const preferencesDoc = await db.collection('notificationPreferences').doc(userId).get();
      const preferences = preferencesDoc.data();

      if (!preferences?.workoutReminders?.enabled) {
        return { success: true, message: 'Workout reminders are disabled' };
      }

      // Calculate reminder dates based on types
      const reminders = [];
      const now = new Date();

      for (const reminderType of reminderTypes) {
        let reminderDate: Date;
        let reminderTitle = 'Workout Reminder';
        let reminderBody = '';

        switch (reminderType) {
          case 'same_day':
            // Get default time from preferences or use 8:00 AM
            const [hour, minute] = (preferences.workoutReminders?.defaultTime || '08:00').split(':');
            reminderDate = new Date(workoutDateTime);
            reminderDate.setHours(parseInt(hour), parseInt(minute), 0, 0);
            reminderTitle = 'Workout Today!';
            reminderBody = `Don't forget: ${workoutTitle} is scheduled for today!`;
            break;

          case 'day_before':
            reminderDate = new Date(workoutDateTime.getTime() - (24 * 60 * 60 * 1000));
            reminderDate.setHours(20, 0, 0, 0); // 8 PM the day before
            reminderTitle = 'Workout Tomorrow';
            reminderBody = `Get ready! ${workoutTitle} is scheduled for tomorrow.`;
            break;

          case 'two_days':
            reminderDate = new Date(workoutDateTime.getTime() - (2 * 24 * 60 * 60 * 1000));
            reminderDate.setHours(19, 0, 0, 0); // 7 PM two days before
            reminderTitle = 'Upcoming Workout';
            reminderBody = `${workoutTitle} is coming up in 2 days. Time to prepare!`;
            break;

          case 'week_before':
            reminderDate = new Date(workoutDateTime.getTime() - (7 * 24 * 60 * 60 * 1000));
            reminderDate.setHours(18, 0, 0, 0); // 6 PM a week before
            reminderTitle = 'Workout Next Week';
            reminderBody = `${workoutTitle} is scheduled for next week. Plan ahead!`;
            break;

          default:
            continue; // Skip unknown reminder types
        }

        // Only schedule if reminder is in the future
        if (reminderDate > now) {
          reminders.push({
            userId,
            workoutId,
            type: 'workout_reminder',
            title: reminderTitle,
            body: reminderBody,
            scheduledFor: Timestamp.fromDate(reminderDate),
            data: {
              workoutId,
              workoutTitle,
              reminderType,
              deepLink: `/workout/${workoutId}`
            },
            status: 'scheduled',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
        }
      }

      // Save reminders to Firestore
      const batch = db.batch();
      
      reminders.forEach(reminder => {
        const docRef = db.collection('scheduledNotifications').doc();
        batch.set(docRef, reminder);
      });

      await batch.commit();

      return {
        success: true,
        message: `Scheduled ${reminders.length} workout reminders`,
        remindersScheduled: reminders.length
      };

    } catch (error) {
      console.error('Error in scheduleWorkoutReminder:', error);
      throw new HttpsError('internal', 'Failed to schedule workout reminder');
    }
});