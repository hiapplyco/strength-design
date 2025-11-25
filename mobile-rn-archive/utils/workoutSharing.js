import { Share, Platform, Alert, Clipboard } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { db, auth } from '../firebaseConfig';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

class WorkoutSharing {
  constructor() {
    this.baseShareUrl = 'https://strength.design/shared/workout/';
  }

  // Generate a shareable link for a workout
  async createShareableLink(workout) {
    try {
      // Generate a unique share ID
      const shareId = this.generateShareId();
      
      // Create a public workout document
      const shareData = {
        ...workout,
        sharedBy: auth.currentUser?.uid,
        sharedByName: auth.currentUser?.displayName || 'Anonymous',
        sharedAt: new Date(),
        shareId: shareId,
        viewCount: 0,
        downloads: 0,
        isPublic: true,
      };

      // Save to Firestore shared collection
      await setDoc(doc(db, 'sharedWorkouts', shareId), shareData);
      
      // Update user's shared workouts list
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          sharedWorkouts: arrayUnion(shareId)
        });
      }

      const shareUrl = `${this.baseShareUrl}${shareId}`;
      return { shareId, shareUrl };
    } catch (error) {
      console.error('Error creating shareable link:', error);
      throw error;
    }
  }

  // Share workout via native share sheet
  async shareWorkout(workout, method = 'link') {
    try {
      if (method === 'link') {
        const { shareUrl } = await this.createShareableLink(workout);
        
        const shareOptions = {
          title: `Check out my workout: ${workout.title}`,
          message: this.formatShareMessage(workout, shareUrl),
          url: shareUrl, // iOS
        };

        const result = await Share.share(shareOptions);
        
        if (result.action === Share.sharedAction) {
          // Track share analytics
          await this.trackShare(workout.id, method);
          return { success: true, shareUrl };
        } else if (result.action === Share.dismissedAction) {
          return { success: false, dismissed: true };
        }
      } else if (method === 'text') {
        await this.shareAsText(workout);
      } else if (method === 'file') {
        await this.shareAsFile(workout);
      }
    } catch (error) {
      console.error('Error sharing workout:', error);
      Alert.alert('Share Failed', 'Unable to share workout. Please try again.');
      return { success: false, error };
    }
  }

  // Share workout as formatted text
  async shareAsText(workout) {
    const workoutText = this.formatWorkoutAsText(workout);
    
    const shareOptions = {
      title: workout.title,
      message: workoutText,
    };

    try {
      const result = await Share.share(shareOptions);
      if (result.action === Share.sharedAction) {
        await this.trackShare(workout.id, 'text');
      }
      return result;
    } catch (error) {
      console.error('Error sharing as text:', error);
      throw error;
    }
  }

  // Share workout as JSON file
  async shareAsFile(workout) {
    try {
      const fileName = `${workout.title.replace(/\s+/g, '_')}_workout.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Write workout data to file
      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(workout, null, 2),
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
        return { success: false };
      }

      // Share the file
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: `Share ${workout.title}`,
        UTI: 'public.json', // iOS
      });

      await this.trackShare(workout.id, 'file');
      
      // Clean up the file
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
      
      return { success: true };
    } catch (error) {
      console.error('Error sharing as file:', error);
      throw error;
    }
  }

  // Copy workout link to clipboard
  async copyToClipboard(workout) {
    try {
      const { shareUrl } = await this.createShareableLink(workout);
      await Clipboard.setStringAsync(shareUrl);
      
      Alert.alert(
        'Link Copied!',
        'The workout link has been copied to your clipboard.',
        [{ text: 'OK' }]
      );
      
      return { success: true, shareUrl };
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      Alert.alert('Error', 'Failed to copy link to clipboard');
      return { success: false };
    }
  }

  // Import a shared workout
  async importSharedWorkout(shareId) {
    try {
      const sharedDoc = await getDoc(doc(db, 'sharedWorkouts', shareId));
      
      if (!sharedDoc.exists()) {
        throw new Error('Workout not found');
      }

      const sharedWorkout = sharedDoc.data();
      
      // Update view count
      await updateDoc(doc(db, 'sharedWorkouts', shareId), {
        viewCount: (sharedWorkout.viewCount || 0) + 1,
        lastViewedAt: new Date(),
      });

      // Create a copy for the current user
      const importedWorkout = {
        ...sharedWorkout,
        userId: auth.currentUser?.uid,
        importedFrom: shareId,
        importedAt: new Date(),
        isImported: true,
        originalCreator: sharedWorkout.sharedByName,
      };

      // Remove sharing-specific fields
      delete importedWorkout.shareId;
      delete importedWorkout.sharedBy;
      delete importedWorkout.sharedAt;
      delete importedWorkout.viewCount;
      delete importedWorkout.downloads;

      return importedWorkout;
    } catch (error) {
      console.error('Error importing shared workout:', error);
      throw error;
    }
  }

  // Format workout for sharing
  formatShareMessage(workout, shareUrl) {
    let message = `🏋️ ${workout.title}\n\n`;
    
    if (workout.summary) {
      message += `${workout.summary}\n\n`;
    }
    
    if (workout.duration) {
      message += `⏱ Duration: ${workout.duration}\n`;
    }
    
    if (workout.difficulty) {
      message += `💪 Difficulty: ${workout.difficulty}\n`;
    }
    
    if (workout.equipment && workout.equipment.length > 0) {
      message += `🎯 Equipment: ${workout.equipment.join(', ')}\n`;
    }
    
    message += `\n🔗 View full workout: ${shareUrl}\n`;
    message += '\nShared via Strength Design 💪';
    
    return message;
  }

  // Format workout as text
  formatWorkoutAsText(workout) {
    let text = `${workout.title}\n${'='.repeat(workout.title.length)}\n\n`;
    
    if (workout.summary) {
      text += `${workout.summary}\n\n`;
    }

    if (workout.weeks && workout.weeks.length > 0) {
      workout.weeks.forEach(week => {
        text += `\nWeek ${week.weekNumber}: ${week.focus || ''}\n`;
        text += '-'.repeat(30) + '\n';
        
        week.days.forEach(day => {
          text += `\nDay ${day.dayNumber}: ${day.dayName}\n`;
          
          if (day.exercises && day.exercises.length > 0) {
            day.exercises.forEach((exercise, index) => {
              text += `${index + 1}. ${exercise.name}`;
              if (exercise.sets && exercise.reps) {
                text += ` - ${exercise.sets} sets x ${exercise.reps} reps`;
              }
              if (exercise.rest) {
                text += ` (Rest: ${exercise.rest})`;
              }
              text += '\n';
              
              if (exercise.instructions && exercise.instructions.length > 0) {
                exercise.instructions.forEach(instruction => {
                  text += `   • ${instruction}\n`;
                });
              }
            });
          }
        });
      });
    }

    text += '\n\nCreated with Strength Design\n';
    text += 'https://strength.design';
    
    return text;
  }

  // Generate unique share ID
  generateShareId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 9);
    return `${timestamp}-${randomStr}`;
  }

  // Track share analytics
  async trackShare(workoutId, method) {
    try {
      // Log share event to analytics
      console.log('Workout shared:', { workoutId, method });
      
      // Update share count in database if needed
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          shareCount: (await getDoc(userRef)).data()?.shareCount + 1 || 1,
          lastShareAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error tracking share:', error);
    }
  }

  // Get share statistics for a workout
  async getShareStats(shareId) {
    try {
      const sharedDoc = await getDoc(doc(db, 'sharedWorkouts', shareId));
      
      if (!sharedDoc.exists()) {
        return null;
      }

      const data = sharedDoc.data();
      return {
        viewCount: data.viewCount || 0,
        downloads: data.downloads || 0,
        sharedAt: data.sharedAt,
        lastViewedAt: data.lastViewedAt,
      };
    } catch (error) {
      console.error('Error getting share stats:', error);
      return null;
    }
  }
}

export default new WorkoutSharing();