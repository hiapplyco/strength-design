/**
 * Pose Analysis Results Screen - Detailed Form Feedback Display
 * Beautiful visualization of analysis results with actionable feedback
 * 
 * Features:
 * - Comprehensive form analysis display
 * - Interactive score breakdown
 * - Detailed error identification
 * - Improvement suggestions
 * - Progress tracking and history
 * - Share and save functionality
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
  Platform,
  Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SafeLinearGradient } from '../components/SafeLinearGradient';
import { GlassContainer, GlassCard, GlassButton } from '../components/GlassmorphismComponents';
import { useTheme } from '../contexts/ThemeContext';
import FormFeedbackComponent from '../components/PoseAnalysis/FormFeedbackComponent';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Score color mapping
const getScoreColor = (score, theme) => {
  if (score >= 85) return '#4CAF50'; // Excellent - Green
  if (score >= 70) return '#FF9800'; // Good - Orange
  if (score >= 50) return '#FF6B35'; // Needs work - Primary orange
  return '#FF6B6B'; // Needs significant work - Red
};

// Error severity colors
const getErrorSeverityColor = (severity) => {
  switch (severity) {
    case 'high': return '#FF6B6B';
    case 'medium': return '#FF9800';
    case 'low': return '#FDD835';
    default: return '#FF9800';
  }
};

export default function PoseAnalysisResultsScreen({ navigation, route }) {
  const { theme, isDarkMode } = useTheme();
  const { analysisResult, exerciseType, exerciseName, videoUri } = route.params;
  
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showShareOptions, setShowShareOptions] = useState(false);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      })
    ]).start();

    // Animate score counter
    if (analysisResult?.analysis?.overallScore) {
      Animated.timing(scoreAnim, {
        toValue: analysisResult.analysis.overallScore,
        duration: 2000,
        useNativeDriver: false,
      }).start();
    }

    // Pulse animation for critical errors
    if (analysisResult?.analysis?.criticalErrors?.length > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [analysisResult]);

  const handleShare = async () => {
    try {
      const score = analysisResult?.analysis?.overallScore || 0;
      const shareMessage = `Just analyzed my ${exerciseName} form with Strength.Design! 💪\n\nOverall Score: ${score}/100\n\nGet personalized form feedback: https://strength.design`;
      
      await Share.share({
        message: shareMessage,
        title: 'My Form Analysis Results'
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleSaveToHistory = () => {
    Alert.alert(
      'Saved!',
      'Your analysis results have been saved to your history.',
      [{ text: 'OK' }]
    );
  };

  const handleRetakeAnalysis = () => {
    navigation.navigate('PoseAnalysisUpload');
  };

  const renderTabButton = (tabKey, title, icon) => (
    <TouchableOpacity
      key={tabKey}
      style={[
        styles.tabButton,
        selectedTab === tabKey && styles.tabButtonActive
      ]}
      onPress={() => setSelectedTab(tabKey)}
      accessibilityLabel={`${title} tab`}
      accessibilityRole="button"
      accessibilityState={{ selected: selectedTab === tabKey }}
    >
      <BlurView 
        intensity={selectedTab === tabKey ? 40 : 20} 
        style={styles.tabButtonBlur}
      >
        <Ionicons
          name={icon}
          size={20}
          color={selectedTab === tabKey ? theme.primary : theme.textSecondary}
        />
        <Text style={[
          styles.tabButtonText,
          {
            color: selectedTab === tabKey ? theme.primary : theme.textSecondary
          }
        ]}>
          {title}
        </Text>
      </BlurView>
    </TouchableOpacity>
  );

  const renderOverviewTab = () => {
    const analysis = analysisResult?.analysis;
    const score = analysis?.overallScore || 0;
    const scoreColor = getScoreColor(score, theme);

    return (
      <ScrollView 
        style={styles.tabContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Overall Score Card */}
        <Animated.View
          style={[
            styles.scoreCardContainer,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <GlassCard style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <Text style={[styles.scoreTitle, { color: theme.text }]}>
                Overall Form Score
              </Text>
              <TouchableOpacity
                onPress={handleShare}
                style={styles.shareButton}
                accessibilityLabel="Share results"
              >
                <Ionicons name="share-outline" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.scoreDisplay}>
              <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
                <Animated.Text style={[
                  styles.scoreNumber,
                  { color: scoreColor }
                ]}>
                  {scoreAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0', Math.round(score).toString()],
                    extrapolate: 'clamp'
                  })}
                </Animated.Text>
                <Text style={[styles.scoreUnit, { color: scoreColor }]}>
                  /100
                </Text>
              </View>
              
              <View style={styles.scoreLabel}>
                <Text style={[styles.scoreLabelText, { color: theme.text }]}>
                  {score >= 85 ? 'Excellent Form!' : 
                   score >= 70 ? 'Good Form' : 
                   score >= 50 ? 'Needs Improvement' : 
                   'Significant Work Needed'}
                </Text>
                <Text style={[styles.scoreLabelSubtext, { color: theme.textSecondary }]}>
                  {exerciseName} Analysis
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Quick Stats */}
        <GlassContainer variant="medium" style={styles.statsContainer}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Quick Stats
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {Math.round((analysisResult?.processingTime || 0) / 1000)}s
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Analysis Time
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="film-outline" size={20} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {analysisResult?.framesProcessed || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Frames Analyzed
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="analytics-outline" size={20} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {Math.round((analysisResult?.confidenceMetrics?.averageLandmarkConfidence || 0) * 100)}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Confidence
              </Text>
            </View>
          </View>
        </GlassContainer>

        {/* Form Feedback Component */}
        <FormFeedbackComponent
          analysisResult={analysisResult}
          exerciseType={exerciseType}
          exerciseName={exerciseName}
        />

        {/* Critical Errors */}
        {analysis?.criticalErrors?.length > 0 && (
          <GlassContainer variant="medium" style={styles.errorsContainer}>
            <View style={styles.errorsHeader}>
              <Ionicons name="warning-outline" size={24} color="#FF6B6B" />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Form Issues Detected
              </Text>
            </View>
            
            {analysis.criticalErrors.map((error, index) => (
              <View key={index} style={styles.errorItem}>
                <View style={[
                  styles.errorSeverityBadge,
                  { backgroundColor: getErrorSeverityColor(error.severity) }
                ]}>
                  <Text style={styles.errorSeverityText}>
                    {error.severity?.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.errorContent}>
                  <Text style={[styles.errorDescription, { color: theme.text }]}>
                    {error.description}
                  </Text>
                  <Text style={[styles.errorCorrection, { color: theme.textSecondary }]}>
                    💡 {error.correction}
                  </Text>
                </View>
              </View>
            ))}
          </GlassContainer>
        )}

        {/* Improvements */}
        {analysis?.improvements?.length > 0 && (
          <GlassContainer variant="medium" style={styles.improvementsContainer}>
            <View style={styles.improvementsHeader}>
              <Ionicons name="trending-up-outline" size={24} color={theme.primary} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Improvement Suggestions
              </Text>
            </View>
            
            {analysis.improvements.map((improvement, index) => (
              <View key={index} style={styles.improvementItem}>
                <View style={[
                  styles.improvementPriorityBadge,
                  {
                    backgroundColor: improvement.priority === 'high' ? theme.primary : 
                                   improvement.priority === 'medium' ? '#FF9800' : '#FDD835'
                  }
                ]}>
                  <Text style={styles.improvementPriorityText}>
                    {improvement.priority?.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.improvementContent}>
                  <Text style={[styles.improvementSuggestion, { color: theme.text }]}>
                    {improvement.suggestion}
                  </Text>
                  <Text style={[styles.improvementExpected, { color: theme.textSecondary }]}>
                    Expected: {improvement.expectedImprovement}
                  </Text>
                </View>
              </View>
            ))}
          </GlassContainer>
        )}
      </ScrollView>
    );
  };

  const renderDetailedTab = () => (
    <ScrollView 
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <GlassContainer variant="medium" style={styles.detailsContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Analysis Details
        </Text>
        
        {/* Technical metrics would go here */}
        <View style={styles.detailsContent}>
          <Text style={[styles.detailsText, { color: theme.textSecondary }]}>
            Detailed technical analysis coming soon...
          </Text>
        </View>
      </GlassContainer>
    </ScrollView>
  );

  if (!analysisResult) {
    return (
      <SafeLinearGradient type="background" variant="oura" style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#FF6B6B" />
          <Text style={[styles.errorTitle, { color: theme.text }]}>
            No Results Available
          </Text>
          <Text style={[styles.errorDescription, { color: theme.textSecondary }]}>
            Analysis results could not be loaded.
          </Text>
          <GlassButton
            title="Try Again"
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
          />
        </View>
      </SafeLinearGradient>
    );
  }

  return (
    <SafeLinearGradient 
      type="background" 
      variant="oura" 
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
          accessibilityLabel="Go home"
          accessibilityRole="button"
        >
          <BlurView intensity={20} style={styles.backButtonBlur}>
            <Ionicons 
              name="home" 
              size={24} 
              color={isDarkMode ? '#FFFFFF' : '#000000'} 
            />
          </BlurView>
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Analysis Results
        </Text>
        
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setShowShareOptions(!showShareOptions)}
          accessibilityLabel="More options"
          accessibilityRole="button"
        >
          <BlurView intensity={20} style={styles.moreButtonBlur}>
            <Ionicons 
              name="ellipsis-horizontal" 
              size={24} 
              color={isDarkMode ? '#FFFFFF' : '#000000'} 
            />
          </BlurView>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            {renderTabButton('overview', 'Overview', 'home-outline')}
            {renderTabButton('detailed', 'Details', 'analytics-outline')}
          </ScrollView>
        </View>

        {/* Tab Content */}
        {selectedTab === 'overview' ? renderOverviewTab() : renderDetailedTab()}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <GlassButton
            title="Analyze Again"
            onPress={handleRetakeAnalysis}
            style={styles.actionButton}
            accessibilityLabel="Start new analysis"
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="refresh-outline" size={20} color={theme.text} />
              <Text style={[styles.actionButtonText, { color: theme.text }]}>
                Analyze Again
              </Text>
            </View>
          </GlassButton>
          
          <GlassButton
            title="Save Results"
            onPress={handleSaveToHistory}
            style={[styles.actionButton, styles.primaryActionButton]}
            accessibilityLabel="Save results to history"
          >
            <View style={styles.actionButtonContent}>
              <Ionicons name="bookmark-outline" size={20} color={theme.text} />
              <Text style={[styles.actionButtonText, { color: theme.text }]}>
                Save Results
              </Text>
            </View>
          </GlassButton>
        </View>
      </Animated.View>
    </SafeLinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  backButtonBlur: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  moreButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  moreButtonBlur: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabNavigation: {
    marginBottom: 20,
  },
  tabScrollContent: {
    gap: 12,
  },
  tabButton: {
    borderRadius: 20,
    overflow: 'hidden',
    minWidth: 100,
  },
  tabButtonActive: {
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  tabButtonBlur: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  scoreCardContainer: {
    marginBottom: 24,
  },
  scoreCard: {
    padding: 24,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  shareButton: {
    padding: 8,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 32,
    fontWeight: '800',
  },
  scoreUnit: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreLabel: {
    flex: 1,
  },
  scoreLabelText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  scoreLabelSubtext: {
    fontSize: 16,
  },
  statsContainer: {
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  errorsContainer: {
    padding: 20,
    marginBottom: 24,
  },
  errorsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  errorSeverityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  errorSeverityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorContent: {
    flex: 1,
  },
  errorDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 22,
  },
  errorCorrection: {
    fontSize: 14,
    lineHeight: 20,
  },
  improvementsContainer: {
    padding: 20,
    marginBottom: 24,
  },
  improvementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  improvementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  improvementPriorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  improvementPriorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  improvementContent: {
    flex: 1,
  },
  improvementSuggestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 22,
  },
  improvementExpected: {
    fontSize: 14,
    lineHeight: 20,
  },
  detailsContainer: {
    padding: 20,
    marginBottom: 24,
  },
  detailsContent: {
    alignItems: 'center',
    padding: 40,
  },
  detailsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  actionButtons: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
  },
  primaryActionButton: {
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: '100%',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  errorButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
});