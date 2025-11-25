/**
 * PoseAnalysisLiveScreen
 * Streams camera + audio directly to Gemini 2.5 Flash Live via WebRTC and
 * surfaces real-time coaching feedback.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient } from '../components/SafeLinearGradient';
import {
  GlassContainer,
  GlassButton,
} from '../components/GlassmorphismComponents';
import { useTheme } from '../contexts/ThemeContext';
import GeminiLiveStreamService from '../services/geminiLiveStreamService';

const MAX_INSIGHTS = 25;

export default function PoseAnalysisLiveScreen({ navigation, route }) {
  const { exerciseType, exerciseName } = route.params || {};
  const themeContext = useTheme();
  const theme = themeContext?.colors || {
    primary: '#FF6B35',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
  };

  const serviceRef = useRef(new GeminiLiveStreamService());
  const [status, setStatus] = useState('Preparing live session…');
  const [insights, setInsights] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const startSession = useCallback(async () => {
    try {
      setErrorMessage(null);
      await serviceRef.current.startSession({
        exerciseType,
        exerciseName,
        facingMode: 'environment',
      });
      setSessionActive(true);
    } catch (error) {
      const message = error?.message || 'Unable to start live analysis.';
      setErrorMessage(message);
      Alert.alert('Live Session Error', message, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [exerciseType, exerciseName, navigation]);

  useEffect(() => {
    const service = serviceRef.current;
    const unsubscribers = [
      service.on('status', setStatus),
      service.on('error', (err) => {
        const message = err?.message || 'Live session error.';
        setErrorMessage(message);
        setStatus(message);
      }),
      service.on('insight', (insight) => {
        setInsights((prev) => {
          const updated = [insight, ...prev];
          return updated.slice(0, MAX_INSIGHTS);
        });
      }),
      service.on('localStream', setLocalStream),
      service.on('remoteStream', setRemoteStream),
      service.on('sessionEnded', () => setSessionActive(false)),
    ];

    startSession();

    return () => {
      service.stopSession();
      unsubscribers.forEach((unsubscribe) => unsubscribe && unsubscribe());
    };
  }, [startSession]);

  const handleStop = useCallback(
    async (shouldPersist) => {
      setIsSaving(true);
      const summary = await serviceRef.current.stopSession();
      setSessionActive(false);
      setIsSaving(false);

      if (!shouldPersist) {
        navigation.goBack();
        return;
      }

      const analysisResult = buildAnalysisResult(
        summary,
        insights,
        exerciseType,
        exerciseName
      );

      navigation.replace('PoseAnalysisResults', {
        analysisResult,
        exerciseType,
        exerciseName,
        videoUri: null,
      });
    },
    [exerciseType, exerciseName, insights, navigation]
  );

  return (
    <SafeLinearGradient
      type="background"
      variant="oura"
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => handleStop(false)}
        >
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text }]}>
            Live Form Analysis
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {exerciseName || exerciseType || 'Select Exercise'}
          </Text>
        </View>
        <View style={styles.iconButtonPlaceholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <GlassContainer variant="strong" style={styles.previewCard}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Camera Preview
          </Text>
          {localStream ? (
            <RTCView
              streamURL={localStream.toURL()}
              style={styles.preview}
              mirror={false}
              objectFit="cover"
            />
          ) : (
            <View style={styles.previewPlaceholder}>
              <ActivityIndicator color={theme.primary} />
              <Text
                style={[styles.previewPlaceholderText, { color: theme.text }]}
              >
                Waiting for camera…
              </Text>
            </View>
          )}
          <View style={styles.statusRow}>
            <Ionicons
              name={sessionActive ? 'radio' : 'radio-outline'}
              color={sessionActive ? '#F87171' : theme.textSecondary}
              size={16}
            />
            <Text style={[styles.statusText, { color: theme.textSecondary }]}>
              {status}
            </Text>
          </View>
        </GlassContainer>

        <GlassContainer variant="medium" style={styles.insightsCard}>
          <View style={styles.insightsHeader}>
            <Ionicons
              name="flash-outline"
              size={20}
              color={theme.primary}
            />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Gemini Feedback
            </Text>
          </View>
          {errorMessage && (
            <Text style={[styles.errorText, { color: '#F87171' }]}>
              {errorMessage}
            </Text>
          )}
          {!insights.length && !errorMessage ? (
            <Text
              style={[styles.placeholderText, { color: theme.textSecondary }]}
            >
              Streaming live feedback… Keep moving through the exercise to see
              cues from Gemini.
            </Text>
          ) : (
            insights.map((insight) => (
              <View key={insight.id} style={styles.insightItem}>
                <Text style={[styles.insightTimestamp, { color: theme.textSecondary }]}>
                  {new Date(insight.timestamp).toLocaleTimeString()}
                </Text>
                <Text style={[styles.insightText, { color: theme.text }]}>
                  {insight.text}
                </Text>
              </View>
            ))
          )}
        </GlassContainer>

        <GlassContainer variant="subtle" style={styles.remoteAudioCard}>
          <View style={styles.remoteAudioRow}>
            <Ionicons
              name="musical-notes-outline"
              size={20}
              color={remoteStream ? theme.primary : theme.textSecondary}
            />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Gemini Audio
            </Text>
          </View>
          <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
            {remoteStream
              ? 'Connected to Gemini voice coaching. Audio will play automatically.'
              : 'Waiting for Gemini audio output…'}
          </Text>
          {remoteStream && (
            <RTCView
              streamURL={remoteStream.toURL()}
              style={styles.remoteAudioStream}
              objectFit="cover"
            />
          )}
        </GlassContainer>
      </ScrollView>

      <View style={styles.bottomActions}>
        <GlassButton
          style={[
            styles.saveButton,
            (!sessionActive || isSaving) && styles.disabledButton,
          ]}
          disabled={!sessionActive || isSaving}
          onPress={() => handleStop(true)}
        >
          <View style={styles.buttonContent}>
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Ionicons name="download-outline" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.buttonText}>
              {isSaving ? 'Saving…' : 'Save Session'}
            </Text>
          </View>
        </GlassButton>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handleStop(false)}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>
            End Without Saving
          </Text>
        </TouchableOpacity>
      </View>
    </SafeLinearGradient>
  );
}

function buildAnalysisResult(summary, insights, exerciseType, exerciseName) {
  const orderedInsights = summary?.insights?.length
    ? summary.insights
    : insights;

  const narrative = orderedInsights
    .map((insight) => `• ${insight.text}`)
    .join('\n');

  const scoreSources = [
    summary?.metrics?.overallScore,
    summary?.metrics?.form_score,
    summary?.metrics?.score,
  ];

  const numericScore = scoreSources
    .map((value) => {
      const parsed = typeof value === 'string' ? parseFloat(value) : value;
      if (Number.isFinite(parsed)) {
        return Math.max(0, Math.min(100, Math.round(parsed)));
      }
      return null;
    })
    .find((value) => value !== null);

  return {
    success: true,
    exerciseType,
    exerciseName,
    analysis: {
      overallScore: numericScore ?? 0,
      summary:
        narrative ||
        'Live session completed. Gemini live feedback will be available shortly.',
      components: summary?.metrics?.components || {},
      keyPhases: summary?.metrics?.phases || [],
      improvements: orderedInsights
        .filter((insight) => insight.type !== 'metrics')
        .map((insight) => ({
          type: insight.type || 'live_feedback',
          message: insight.text,
        })),
    },
    feedback: orderedInsights
      .filter((insight) => insight.type !== 'metrics')
      .map((insight) => ({
        priority: 'live',
        title: insight.type === 'metrics' ? 'Metrics' : 'Live Feedback',
        description: insight.text,
      })),
    metadata: {
      provider: 'gemini-live',
      sessionName: summary?.sessionName,
      model: summary?.model,
      startedAt: summary?.startedAt,
      endedAt: summary?.endedAt,
    },
    confidenceMetrics: summary?.metrics || {},
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconButtonPlaceholder: {
    width: 44,
    height: 44,
  },
  headerText: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 140,
    gap: 20,
  },
  previewCard: {
    padding: 16,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  preview: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  previewPlaceholder: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 10,
  },
  previewPlaceholderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 13,
  },
  insightsCard: {
    padding: 16,
    gap: 12,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 14,
    lineHeight: 20,
  },
  insightItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  insightTimestamp: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  insightText: {
    fontSize: 15,
    lineHeight: 20,
  },
  remoteAudioCard: {
    padding: 16,
    gap: 12,
  },
  remoteAudioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  remoteAudioStream: {
    width: '100%',
    height: 1,
    opacity: 0.01, // Keep audio active without showing a second video feed
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 24,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
