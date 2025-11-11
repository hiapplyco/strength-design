import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import calendarIntegration from '../utils/calendarIntegration';

export default function WorkoutScheduler({ workout, visible, onClose, onScheduled }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [scheduledEvents, setScheduledEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [upcomingWorkouts, setUpcomingWorkouts] = useState([]);
  const [scheduleType, setScheduleType] = useState('single'); // 'single' or 'program'

  useEffect(() => {
    if (visible) {
      loadUpcomingWorkouts();
    }
  }, [visible]);

  const loadUpcomingWorkouts = async () => {
    const upcoming = await calendarIntegration.getUpcomingWorkouts(30);
    setUpcomingWorkouts(upcoming);
  };

  const handleScheduleSingle = async () => {
    setLoading(true);
    try {
      const result = await calendarIntegration.scheduleWorkout(
        workout,
        selectedDate,
        {
          hour: selectedTime.getHours(),
          minute: selectedTime.getMinutes(),
        }
      );

      if (result) {
        Alert.alert(
          '✅ Scheduled!',
          `Your workout has been added to your calendar for ${formatDate(selectedDate)} at ${formatTime(selectedTime)}`,
          [
            { text: 'OK', onPress: () => {
              onScheduled?.(result);
              onClose();
            }}
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule workout');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleProgram = async () => {
    setLoading(true);
    try {
      const events = await calendarIntegration.scheduleWorkoutProgram(
        workout,
        selectedDate
      );

      if (events.length > 0) {
        setScheduledEvents(events);
        Alert.alert(
          '✅ Program Scheduled!',
          `${events.length} workout sessions have been added to your calendar starting ${formatDate(selectedDate)}`,
          [
            { text: 'View Calendar', onPress: () => openCalendar() },
            { text: 'OK', onPress: () => {
              onScheduled?.(events);
              onClose();
            }}
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule workout program');
    } finally {
      setLoading(false);
    }
  };

  const openCalendar = () => {
    // This would open the device's calendar app
    // Implementation varies by platform
    if (Platform.OS === 'ios') {
      // Linking.openURL('calshow:');
    } else {
      // Linking.openURL('content://com.android.calendar/time/');
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderScheduleTypeSelector = () => (
    <View style={styles.typeSelector}>
      <TouchableOpacity
        style={[
          styles.typeButton,
          scheduleType === 'single' && styles.typeButtonActive
        ]}
        onPress={() => setScheduleType('single')}
      >
        <Ionicons 
          name="calendar-outline" 
          size={20} 
          color={scheduleType === 'single' ? 'white' : '#999'} 
        />
        <Text style={[
          styles.typeButtonText,
          scheduleType === 'single' && styles.typeButtonTextActive
        ]}>
          Single Session
        </Text>
      </TouchableOpacity>
      
      {workout.weeks && (
        <TouchableOpacity
          style={[
            styles.typeButton,
            scheduleType === 'program' && styles.typeButtonActive
          ]}
          onPress={() => setScheduleType('program')}
        >
          <Ionicons 
            name="calendar" 
            size={20} 
            color={scheduleType === 'program' ? 'white' : '#999'} 
          />
          <Text style={[
            styles.typeButtonText,
            scheduleType === 'program' && styles.typeButtonTextActive
          ]}>
            Full Program
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderDateTimeSelector = () => (
    <View style={styles.dateTimeContainer}>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar" size={20} color="#FF6B35" />
        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
      </TouchableOpacity>

      {scheduleType === 'single' && (
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Ionicons name="time" size={20} color="#FF6B35" />
          <Text style={styles.timeText}>{formatTime(selectedTime)}</Text>
        </TouchableOpacity>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            setShowDatePicker(Platform.OS === 'android');
            if (date) setSelectedDate(date);
          }}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, time) => {
            setShowTimePicker(Platform.OS === 'android');
            if (time) setSelectedTime(time);
          }}
        />
      )}
    </View>
  );

  const renderWorkoutPreview = () => (
    <View style={styles.previewContainer}>
      <Text style={styles.previewTitle}>{workout.title}</Text>
      {workout.summary && (
        <Text style={styles.previewSummary}>{workout.summary}</Text>
      )}
      
      {scheduleType === 'program' && workout.weeks && (
        <View style={styles.programInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="calendar" size={16} color="#666" />
            <Text style={styles.infoText}>
              {workout.weeks.length} weeks
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="fitness" size={16} color="#666" />
            <Text style={styles.infoText}>
              {workout.weeks[0]?.days.length || 0} days/week
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderUpcomingWorkouts = () => {
    if (upcomingWorkouts.length === 0) return null;

    return (
      <View style={styles.upcomingContainer}>
        <Text style={styles.upcomingTitle}>Upcoming Workouts</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {upcomingWorkouts.slice(0, 5).map((workout, index) => (
            <View key={index} style={styles.upcomingCard}>
              <Text style={styles.upcomingDate}>
                {workout.date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
              <Text style={styles.upcomingName} numberOfLines={1}>
                {workout.title}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <LinearGradient
            colors={['#FF6B35', '#F7931E']}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Schedule Workout</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.content}>
            {renderWorkoutPreview()}
            {renderScheduleTypeSelector()}
            {renderDateTimeSelector()}
            {renderUpcomingWorkouts()}

            <View style={styles.reminderInfo}>
              <Ionicons name="notifications" size={20} color="#FF6B35" />
              <Text style={styles.reminderText}>
                You'll receive reminders 1 hour and 15 minutes before your workout
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.scheduleButton}
              onPress={scheduleType === 'single' ? handleScheduleSingle : handleScheduleProgram}
              disabled={loading}
            >
              <LinearGradient
                colors={['#FF6B35', '#F7931E']}
                style={styles.scheduleButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="calendar-outline" size={20} color="white" />
                    <Text style={styles.scheduleButtonText}>
                      Schedule {scheduleType === 'program' ? 'Program' : 'Workout'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0a0a0a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
  },
  previewContainer: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  previewSummary: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  programInfo: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoText: {
    color: '#666',
    fontSize: 14,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  typeButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  typeButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  dateTimeContainer: {
    marginBottom: 20,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  dateText: {
    color: 'white',
    fontSize: 16,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
  },
  timeText: {
    color: 'white',
    fontSize: 16,
  },
  upcomingContainer: {
    marginBottom: 20,
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  upcomingCard: {
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  upcomingDate: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  upcomingName: {
    fontSize: 10,
    color: '#999',
    marginTop: 5,
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  reminderText: {
    flex: 1,
    color: '#999',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '500',
  },
  scheduleButton: {
    flex: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  scheduleButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 15,
  },
  scheduleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});