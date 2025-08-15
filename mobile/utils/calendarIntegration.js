import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CALENDAR_ID_KEY = '@workout_calendar_id';

class CalendarIntegration {
  constructor() {
    this.calendarId = null;
  }

  async requestPermissions() {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Calendar access is needed to schedule workouts.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  }

  async getOrCreateCalendar() {
    try {
      // Check if we have a stored calendar ID
      const storedCalendarId = await AsyncStorage.getItem(CALENDAR_ID_KEY);
      if (storedCalendarId) {
        // Verify it still exists
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        const exists = calendars.find(cal => cal.id === storedCalendarId);
        if (exists) {
          this.calendarId = storedCalendarId;
          return storedCalendarId;
        }
      }

      // Create a new calendar
      const defaultCalendarSource = Platform.select({
        ios: await this.getDefaultCalendarSource(),
        android: { isLocalAccount: true, name: 'Strength Design' },
      });

      const calendarId = await Calendar.createCalendarAsync({
        title: 'Strength Design Workouts',
        color: '#FF6B35',
        entityType: Calendar.EntityTypes.EVENT,
        sourceId: defaultCalendarSource.id,
        source: defaultCalendarSource,
        name: 'Strength Design',
        ownerAccount: 'personal',
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      });

      // Store the calendar ID
      await AsyncStorage.setItem(CALENDAR_ID_KEY, calendarId);
      this.calendarId = calendarId;
      return calendarId;
    } catch (error) {
      console.error('Error creating calendar:', error);
      throw error;
    }
  }

  async getDefaultCalendarSource() {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const defaultCalendar = calendars.find(cal => cal.source.name === 'iCloud') ||
                           calendars.find(cal => cal.source.name === 'Default') ||
                           calendars[0];
    return defaultCalendar.source;
  }

  async scheduleWorkout(workout, date, time = { hour: 9, minute: 0 }) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const calendarId = await this.getOrCreateCalendar();
      
      // Create start and end dates
      const startDate = new Date(date);
      startDate.setHours(time.hour, time.minute, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 1); // Default 1 hour duration

      const eventDetails = {
        title: workout.title || 'Workout Session',
        startDate,
        endDate,
        location: workout.location || 'Gym',
        notes: this.formatWorkoutNotes(workout),
        alarms: [
          { relativeOffset: -60 }, // 1 hour before
          { relativeOffset: -15 }, // 15 minutes before
        ],
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      const eventId = await Calendar.createEventAsync(calendarId, eventDetails);
      
      return {
        eventId,
        calendarId,
        startDate,
        endDate,
      };
    } catch (error) {
      console.error('Error scheduling workout:', error);
      Alert.alert('Error', 'Failed to schedule workout in calendar');
      return null;
    }
  }

  async scheduleWorkoutProgram(program, startDate) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return [];

      const calendarId = await this.getOrCreateCalendar();
      const scheduledEvents = [];
      
      let currentDate = new Date(startDate);
      
      for (const week of program.weeks) {
        for (const day of week.days) {
          // Skip rest days
          if (day.isRestDay) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }

          const eventStartDate = new Date(currentDate);
          eventStartDate.setHours(9, 0, 0, 0); // Default 9 AM
          
          const eventEndDate = new Date(eventStartDate);
          const duration = this.estimateDuration(day);
          eventEndDate.setMinutes(eventEndDate.getMinutes() + duration);

          const eventDetails = {
            title: `Week ${week.weekNumber} - ${day.dayName}`,
            startDate: eventStartDate,
            endDate: eventEndDate,
            location: 'Gym',
            notes: this.formatDayNotes(day, week.weekNumber),
            alarms: [
              { relativeOffset: -60 }, // 1 hour before
              { relativeOffset: -15 }, // 15 minutes before
            ],
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          };

          const eventId = await Calendar.createEventAsync(calendarId, eventDetails);
          
          scheduledEvents.push({
            eventId,
            weekNumber: week.weekNumber,
            dayNumber: day.dayNumber,
            date: eventStartDate,
          });

          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      return scheduledEvents;
    } catch (error) {
      console.error('Error scheduling workout program:', error);
      Alert.alert('Error', 'Failed to schedule workout program');
      return [];
    }
  }

  async updateWorkoutEvent(eventId, updates) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      await Calendar.updateEventAsync(eventId, updates);
      return true;
    } catch (error) {
      console.error('Error updating workout event:', error);
      return false;
    }
  }

  async deleteWorkoutEvent(eventId) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      await Calendar.deleteEventAsync(eventId);
      return true;
    } catch (error) {
      console.error('Error deleting workout event:', error);
      return false;
    }
  }

  async getUpcomingWorkouts(days = 7) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return [];

      const calendarId = await this.getOrCreateCalendar();
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const events = await Calendar.getEventsAsync(
        [calendarId],
        startDate,
        endDate
      );

      return events.map(event => ({
        id: event.id,
        title: event.title,
        date: new Date(event.startDate),
        endDate: new Date(event.endDate),
        notes: event.notes,
        location: event.location,
      }));
    } catch (error) {
      console.error('Error getting upcoming workouts:', error);
      return [];
    }
  }

  formatWorkoutNotes(workout) {
    let notes = `${workout.summary || ''}\n\n`;
    
    if (workout.exercises && workout.exercises.length > 0) {
      notes += 'Exercises:\n';
      workout.exercises.forEach((exercise, index) => {
        notes += `${index + 1}. ${exercise.name}`;
        if (exercise.sets && exercise.reps) {
          notes += ` - ${exercise.sets}x${exercise.reps}`;
        }
        notes += '\n';
      });
    }

    if (workout.equipment && workout.equipment.length > 0) {
      notes += `\nEquipment needed: ${workout.equipment.join(', ')}`;
    }

    if (workout.targetMuscles && workout.targetMuscles.length > 0) {
      notes += `\nTarget muscles: ${workout.targetMuscles.join(', ')}`;
    }

    return notes;
  }

  formatDayNotes(day, weekNumber) {
    let notes = `Week ${weekNumber} - Day ${day.dayNumber}\n`;
    notes += `${day.dayName}\n\n`;
    
    if (day.muscles && day.muscles.length > 0) {
      notes += `Target muscles: ${day.muscles.join(', ')}\n\n`;
    }

    if (day.exercises && day.exercises.length > 0) {
      notes += 'Workout:\n';
      day.exercises.forEach((exercise, index) => {
        notes += `${index + 1}. ${exercise.name}`;
        if (exercise.sets && exercise.reps) {
          notes += ` - ${exercise.sets} sets x ${exercise.reps} reps`;
        }
        if (exercise.rest) {
          notes += ` (Rest: ${exercise.rest})`;
        }
        notes += '\n';
      });
    }

    if (day.estimatedDuration) {
      notes += `\nEstimated duration: ${day.estimatedDuration}`;
    }

    return notes;
  }

  estimateDuration(day) {
    // Parse duration from string like "45-60 minutes"
    if (day.estimatedDuration) {
      const match = day.estimatedDuration.match(/(\d+)/);
      if (match) {
        return parseInt(match[1]);
      }
    }
    
    // Estimate based on number of exercises
    if (day.exercises) {
      return Math.min(90, 30 + (day.exercises.length * 5));
    }
    
    return 60; // Default 60 minutes
  }

  async syncWithCalendar(workouts) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

      const calendarId = await this.getOrCreateCalendar();
      
      // Get existing events
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3); // Look 3 months ahead
      
      const existingEvents = await Calendar.getEventsAsync(
        [calendarId],
        startDate,
        endDate
      );

      // Sync logic here - compare workouts with existing events
      // Update, create, or delete as needed
      
      return true;
    } catch (error) {
      console.error('Error syncing with calendar:', error);
      return false;
    }
  }
}

export default new CalendarIntegration();