import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const db = getFirestore();

interface ScheduleDailyMotivationData {
  userId: string;
  time: string; // HH:MM format
  daysOfWeek: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
}

const motivationalMessages = [
  "Time to crush your fitness goals! 💪",
  "Your future self will thank you for today's workout! 🔥",
  "Champions are made in the gym. Let's go! 🏆",
  "Every workout is a step closer to your goals! ⚡",
  "Your body can do it. It's your mind you need to convince! 🧠",
  "Strong mind, strong body, strong life! 💪",
  "No excuses, just results. Time to train! 🚀",
  "Today's effort is tomorrow's strength! 💯",
  "Push yourself because no one else will! 🔥",
  "The only bad workout is the one that didn't happen! ✨"
];

const dayMapping = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
};

export const scheduleDailyMotivation = onCall({ cors: true }, async (request) => {
    const { userId, time, daysOfWeek } = request.data as ScheduleDailyMotivationData;

    // Validate input
    if (!userId || !time || !Array.isArray(daysOfWeek)) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      throw new HttpsError('invalid-argument', 'Invalid time format. Use HH:MM');
    }

    try {
      // Get user's notification preferences
      const preferencesDoc = await db.collection('notificationPreferences').doc(userId).get();
      const preferences = preferencesDoc.data();

      if (!preferences?.dailyMotivation?.enabled) {
        return { success: true, message: 'Daily motivation notifications are disabled' };
      }

      // Cancel existing daily motivation notifications for this user
      const existingQuery = await db
        .collection('scheduledNotifications')
        .where('userId', '==', userId)
        .where('type', '==', 'daily_motivation')
        .where('status', '==', 'scheduled')
        .get();

      const batch = db.batch();

      // Cancel existing notifications
      existingQuery.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'cancelled',
          updatedAt: Timestamp.now()
        });
      });

      // Parse time
      const [hour, minute] = time.split(':').map(Number);

      // Schedule new notifications for the next 30 days
      const notifications = [];
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      // Generate notifications for each day
      for (let date = new Date(now); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dayName = Object.keys(dayMapping).find(key => 
          dayMapping[key as keyof typeof dayMapping] === date.getDay()
        ) as keyof typeof dayMapping;

        if (daysOfWeek.includes(dayName)) {
          const notificationDate = new Date(date);
          notificationDate.setHours(hour, minute, 0, 0);

          // Only schedule if it's in the future
          if (notificationDate > now) {
            const randomMessage = motivationalMessages[
              Math.floor(Math.random() * motivationalMessages.length)
            ];

            notifications.push({
              userId,
              type: 'daily_motivation',
              title: 'Daily Motivation',
              body: randomMessage,
              scheduledFor: Timestamp.fromDate(notificationDate),
              data: {
                type: 'daily_motivation',
                dayOfWeek: dayName,
                deepLink: '/workouts'
              },
              status: 'scheduled',
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            });
          }
        }
      }

      // Add new notifications to batch
      notifications.forEach(notification => {
        const docRef = db.collection('scheduledNotifications').doc();
        batch.set(docRef, notification);
      });

      await batch.commit();

      return {
        success: true,
        message: `Scheduled ${notifications.length} daily motivation notifications`,
        notificationsScheduled: notifications.length,
        cancelledExisting: existingQuery.docs.length
      };

    } catch (error) {
      console.error('Error in scheduleDailyMotivation:', error);
      throw new HttpsError('internal', 'Failed to schedule daily motivation notifications');
    }
});