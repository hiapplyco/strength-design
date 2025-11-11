/**
 * Tutorial Integration Example
 * 
 * Comprehensive example demonstrating how all Stream C tutorial components
 * work together with Stream A services and Stream B interactive components.
 * 
 * This example shows:
 * 1. TutorialScreen as the main hub
 * 2. RecordingGuidance providing real-time help during recording
 * 3. PoseAnalysisTutorial for onboarding new users
 * 4. ContextualHelp providing smart assistance throughout the app
 * 
 * Integration Points:
 * - Tutorial services for content management and progress tracking
 * - Interactive components for rich tutorial experiences
 * - Navigation patterns for seamless user flows
 * - Context-aware help system for intelligent assistance
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Stream C Components (our implementation)
import TutorialScreen from '../screens/pose/TutorialScreen';
import RecordingGuidance from '../components/pose/RecordingGuidance';
import PoseAnalysisTutorial from '../components/onboarding/PoseAnalysisTutorial';
import ContextualHelp from '../components/help/ContextualHelp';

// Stream B Components (interactive tutorials)
import InteractiveTutorial from '../components/pose/InteractiveTutorial';
import TutorialVideo from '../components/pose/TutorialVideo';
import ExerciseDemonstration from '../components/pose/ExerciseDemonstration';

// Stream A Services
import tutorialService from '../services/tutorialService';
import contentDeliveryService from '../services/contentDeliveryService';
import tutorialContentManager from '../utils/tutorialContentManager';

// Example App Navigation Stack
const Stack = createStackNavigator();

/**
 * Main App Component showing tutorial integration
 */
export default function TutorialIntegrationApp() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        {/* Main Tutorial Hub */}
        <Stack.Screen name="TutorialHub" component={TutorialHubScreen} />
        
        {/* Individual Tutorial Content */}
        <Stack.Screen name="TutorialContent" component={TutorialContentScreen} />
        
        {/* Recording with Guidance */}
        <Stack.Screen name="GuidedRecording" component={GuidedRecordingScreen} />
        
        {/* Onboarding Flow */}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        
        {/* Contextual Help Demo */}
        <Stack.Screen name="ContextualHelpDemo" component={ContextualHelpDemoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/**
 * Tutorial Hub Screen - Main tutorial entry point
 * Uses TutorialScreen component as the central hub
 */
function TutorialHubScreen({ navigation }) {
  const [userProgress, setUserProgress] = useState(null);

  useEffect(() => {
    loadUserProgress();
  }, []);

  const loadUserProgress = async () => {
    try {
      const progress = await tutorialService.getUserProgress();
      setUserProgress(progress);
    } catch (error) {
      console.error('Failed to load user progress:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TutorialScreen
        navigation={navigation}
        route={{
          params: {
            source: 'app_navigation'
          }
        }}
      />
      
      {/* Contextual Help Integration */}
      <ContextualHelp
        context="tutorial"
        screen="tutorial_hub"
        userBehavior={{
          experienceLevel: userProgress?.level || 'beginner',
          recentActions: ['screen_enter'],
          sessionCount: userProgress?.sessionCount || 1
        }}
        onHelpShown={(help) => console.log('Help shown:', help)}
        onHelpDismissed={(help) => console.log('Help dismissed:', help)}
      />
    </View>
  );
}

/**
 * Individual Tutorial Content Screen
 * Shows how tutorial components integrate with content delivery
 */
function TutorialContentScreen({ navigation, route }) {
  const { tutorial, category } = route.params || {};
  const [content, setContent] = useState(null);

  useEffect(() => {
    loadTutorialContent();
  }, [tutorial]);

  const loadTutorialContent = async () => {
    try {
      // Use content delivery service for optimized loading
      const optimizedContent = await contentDeliveryService.getOptimizedContent({
        contentId: tutorial.id,
        contentType: tutorial.contentType,
        quality: 'auto'
      });
      
      setContent(optimizedContent);
    } catch (error) {
      console.error('Failed to load tutorial content:', error);
    }
  };

  const renderTutorialContent = () => {
    if (!content || !tutorial) return null;

    switch (tutorial.contentType) {
      case 'video':
        return (
          <TutorialVideo
            tutorialId={tutorial.id}
            videoUrl={content.url}
            onProgress={(progress) => {
              tutorialService.updateProgress(tutorial.id, progress);
            }}
            onComplete={() => {
              tutorialService.markCompleted(tutorial.id);
              navigation.goBack();
            }}
          />
        );

      case 'interactive':
        return (
          <InteractiveTutorial
            tutorialId={tutorial.id}
            content={content}
            onProgress={(progress) => {
              tutorialService.updateProgress(tutorial.id, progress);
            }}
            onComplete={() => {
              tutorialService.markCompleted(tutorial.id);
              navigation.goBack();
            }}
          />
        );

      case 'exercise_demo':
        return (
          <ExerciseDemonstration
            exercise={tutorial.exercise}
            demoType={tutorial.demoType}
            content={content}
            onProgress={(progress) => {
              tutorialService.updateProgress(tutorial.id, progress);
            }}
            onComplete={() => {
              tutorialService.markCompleted(tutorial.id);
              navigation.goBack();
            }}
          />
        );

      default:
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.contentTitle}>{tutorial.title}</Text>
            <Text style={styles.contentDescription}>{tutorial.description}</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderTutorialContent()}
      
      {/* Context-sensitive help for tutorial content */}
      <ContextualHelp
        context="tutorial_content"
        screen="tutorial_viewer"
        userBehavior={{
          currentTutorial: tutorial?.id,
          category: category?.id,
          contentType: tutorial?.contentType
        }}
      />
    </View>
  );
}

/**
 * Guided Recording Screen
 * Shows RecordingGuidance integration with video recording
 */
function GuidedRecordingScreen({ navigation, route }) {
  const { exercise = 'squat' } = route.params || {};
  const [recordingPhase, setRecordingPhase] = useState('pre_setup');
  const [setupComplete, setSetupComplete] = useState(false);

  const handleSetupComplete = () => {
    setSetupComplete(true);
    setRecordingPhase('recording');
  };

  const handleRecordingComplete = async () => {
    // Mark guided recording as completed
    await tutorialService.trackUserEngagement('guided_recording_completed', {
      exercise,
      setupTime: Date.now(),
      source: 'tutorial_integration'
    });
    
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Simulated camera view */}
      <View style={styles.cameraView}>
        <Text style={styles.cameraText}>Camera View</Text>
        <Text style={styles.phaseText}>Phase: {recordingPhase}</Text>
      </View>

      {/* Recording Guidance Integration */}
      <RecordingGuidance
        exercise={exercise}
        recordingPhase={recordingPhase}
        onSetupComplete={handleSetupComplete}
        onDismiss={() => navigation.goBack()}
        recordingContext={{
          userLevel: 'beginner',
          isFirstTime: true,
          source: 'tutorial_integration'
        }}
      />

      {/* Contextual help for recording */}
      <ContextualHelp
        context="recording"
        screen="guided_recording"
        userBehavior={{
          exercise,
          recordingPhase,
          setupComplete,
          isFirstTime: true
        }}
      />
    </View>
  );
}

/**
 * Onboarding Screen
 * Shows PoseAnalysisTutorial integration
 */
function OnboardingScreen({ navigation }) {
  const handleOnboardingComplete = async (results) => {
    console.log('Onboarding completed:', results);
    
    // Create personalized learning path
    const learningPath = await tutorialContentManager.createLearningPath({
      goal: results.userSelections.goal,
      focusExercise: results.userSelections.focusExercise,
      experienceLevel: results.userSelections.experienceLevel
    });

    // Navigate to tutorial hub with personalized content
    navigation.navigate('TutorialHub', {
      learningPath,
      onboardingComplete: true
    });
  };

  const handleOnboardingSkip = () => {
    navigation.navigate('TutorialHub', {
      onboardingSkipped: true
    });
  };

  return (
    <View style={styles.container}>
      <PoseAnalysisTutorial
        navigation={navigation}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
        userProfile={{
          experienceLevel: 'beginner',
          hasUsedPoseAnalysis: false
        }}
      />
    </View>
  );
}

/**
 * Contextual Help Demo Screen
 * Shows different help scenarios and triggers
 */
function ContextualHelpDemoScreen({ navigation }) {
  const [helpScenario, setHelpScenario] = useState('first_time');
  const [userBehavior, setUserBehavior] = useState({
    uploadCount: 1,
    averageScore: 65,
    sessionCount: 1,
    experienceLevel: 'beginner'
  });

  const scenarios = {
    first_time: {
      context: 'pose_analysis',
      screen: 'upload_screen',
      behavior: { ...userBehavior, sessionCount: 1 }
    },
    multiple_uploads: {
      context: 'pose_analysis',
      screen: 'results_screen',
      behavior: { ...userBehavior, uploadCount: 5, averageScore: 50 }
    },
    poor_lighting: {
      context: 'recording',
      screen: 'camera_screen',
      behavior: { ...userBehavior, poorLightingCount: 3 }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.demoHeader}>
        <Text style={styles.demoTitle}>Contextual Help Demo</Text>
        <Text style={styles.demoDescription}>
          Current Scenario: {helpScenario}
        </Text>
      </View>

      {/* Demo content area */}
      <View style={styles.demoContent}>
        <Text style={styles.demoContentText}>
          This area simulates different app screens where contextual help would appear
        </Text>
      </View>

      {/* Contextual Help Integration */}
      <ContextualHelp
        context={scenarios[helpScenario].context}
        screen={scenarios[helpScenario].screen}
        userBehavior={scenarios[helpScenario].behavior}
        onHelpShown={(help) => console.log('Demo help shown:', help)}
        onHelpDismissed={(help) => console.log('Demo help dismissed:', help)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center'
  },
  contentDescription: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24
  },
  cameraView: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333'
  },
  cameraText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10
  },
  phaseText: {
    fontSize: 14,
    color: '#FF6B35'
  },
  demoHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  demoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8
  },
  demoDescription: {
    fontSize: 16,
    color: '#ccc'
  },
  demoContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  demoContentText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24
  }
});

/**
 * Integration Testing Utilities
 */
export const IntegrationTestUtils = {
  // Test tutorial service integration
  testTutorialServiceIntegration: async () => {
    try {
      // Test content loading
      const tutorials = await tutorialContentManager.getTutorialsByCategory('exercise_techniques');
      console.log('Loaded tutorials:', tutorials.length);

      // Test progress tracking
      await tutorialService.trackUserEngagement('integration_test', {
        component: 'TutorialScreen',
        action: 'content_loaded'
      });

      // Test personalized recommendations
      const recommendations = await tutorialContentManager.getPersonalizedTutorials({
        userLevel: 'beginner',
        focusExercise: 'squat'
      });
      console.log('Personalized recommendations:', recommendations.length);

      return { success: true, message: 'Tutorial service integration working' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Test component integration
  testComponentIntegration: async () => {
    try {
      // Test that components can communicate
      const tutorialData = {
        id: 'test_tutorial',
        title: 'Test Tutorial',
        contentType: 'interactive'
      };

      // Simulate component data flow
      const progressUpdate = await tutorialService.updateProgress(tutorialData.id, 50);
      const completion = await tutorialService.markCompleted(tutorialData.id);

      return { 
        success: true, 
        message: 'Component integration working',
        data: { progressUpdate, completion }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Test contextual help integration
  testContextualHelpIntegration: async () => {
    try {
      // Test help content loading
      const helpContent = await tutorialService.getContextualHelp({
        context: 'pose_analysis',
        screen: 'upload_screen',
        userLevel: 'beginner'
      });

      // Test behavioral analysis
      const behaviorData = {
        uploadCount: 3,
        averageScore: 60,
        sessionCount: 2
      };

      return {
        success: true,
        message: 'Contextual help integration working',
        data: { helpContent, behaviorData }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};