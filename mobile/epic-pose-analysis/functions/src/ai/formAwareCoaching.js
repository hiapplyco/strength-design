/**
 * Form-Aware AI Coaching
 * Integrates form analysis with AI coaching for intelligent workout and exercise recommendations
 * Issue #16 - Stream B: Enhanced AI Functions & Coaching Logic
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { 
  generateCoachingPrompt, 
  getProgressionRecommendation, 
  assessInjuryRisk,
  EXERCISE_PROGRESSIONS
} from './prompts/formCoaching.js';

const db = admin.firestore();
const geminiApiKey = defineSecret("GEMINI_API_KEY");

/**
 * Generate form-aware workout recommendations based on pose analysis
 */
export const generateFormAwareWorkout = onCall(
  {
    region: "us-central1",
    memory: "1GiB",
    timeoutSeconds: 120,
    secrets: [geminiApiKey],
  },
  async (request) => {
    try {
      const { 
        formAnalysisHistory,
        currentCompetency,
        workoutPreferences = {},
        injuryConsiderations = [],
        targetMuscleGroups = [],
        workoutType = 'strength'
      } = request.data;
      
      const userId = request.auth?.uid;

      if (!userId) {
        throw new HttpsError("unauthenticated", "User must be authenticated");
      }

      logger.info("Generating form-aware workout", {
        userId,
        workoutType,
        hasFormHistory: !!formAnalysisHistory,
        competencyCount: Object.keys(currentCompetency || {}).length
      });

      // Analyze form competency across exercises
      const competencyAnalysis = analyzeFormCompetency(formAnalysisHistory, currentCompetency);
      
      // Assess injury risks based on form patterns
      const injuryRiskAssessment = assessWorkoutInjuryRisks(formAnalysisHistory, injuryConsiderations);
      
      // Generate exercise recommendations
      const exerciseRecommendations = generateExerciseRecommendations(
        competencyAnalysis,
        injuryRiskAssessment,
        targetMuscleGroups,
        workoutPreferences
      );

      // Create AI prompt for workout generation
      const workoutPrompt = buildWorkoutGenerationPrompt(
        exerciseRecommendations,
        competencyAnalysis,
        injuryRiskAssessment,
        workoutPreferences,
        workoutType
      );

      // Generate workout with Gemini AI
      const generatedWorkout = await generateAIWorkout(workoutPrompt, userId);

      // Save workout generation context
      await saveWorkoutContext(userId, {
        formAnalysisUsed: !!formAnalysisHistory,
        competencyAnalysis,
        injuryRiskAssessment,
        exerciseRecommendations,
        generatedAt: new Date().toISOString()
      });

      return {
        success: true,
        workout: generatedWorkout,
        formInsights: {
          competencyAnalysis,
          injuryRiskAssessment,
          exerciseRecommendations
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          workoutType,
          formAware: true
        }
      };

    } catch (error) {
      logger.error("Form-aware workout generation failed", {
        error: error.message,
        stack: error.stack,
        userId: request.auth?.uid
      });

      throw new HttpsError("internal", `Workout generation failed: ${error.message}`);
    }
  }
);

/**
 * Get personalized coaching cues based on form analysis
 */
export const getPersonalizedCoachingCues = onCall(
  {
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 60,
    secrets: [geminiApiKey],
  },
  async (request) => {
    try {
      const {
        exerciseType,
        currentFormAnalysis,
        formHistory,
        coachingStyle = 'supportive',
        focusAreas = []
      } = request.data;
      
      const userId = request.auth?.uid;

      if (!userId) {
        throw new HttpsError("unauthenticated", "User must be authenticated");
      }

      if (!exerciseType) {
        throw new HttpsError("invalid-argument", "Exercise type is required");
      }

      logger.info("Generating personalized coaching cues", {
        userId,
        exerciseType,
        coachingStyle,
        hasCurrentAnalysis: !!currentFormAnalysis,
        hasHistory: !!formHistory
      });

      // Analyze user's form competency for this exercise
      const competency = calculateExerciseCompetency(formHistory, exerciseType);
      
      // Assess injury risks
      const injuryRisk = assessInjuryRisk(exerciseType, currentFormAnalysis, formHistory);
      
      // Generate progression recommendations
      const progression = getProgressionRecommendation(exerciseType, competency, currentFormAnalysis?.overallScore || 0);

      // Create coaching prompt
      const coachingPrompt = generateCoachingPrompt(
        exerciseType,
        currentFormAnalysis,
        competency.level,
        coachingStyle
      );

      // Generate personalized cues with AI
      const personalizedCues = await generatePersonalizedCues(
        coachingPrompt,
        currentFormAnalysis,
        competency,
        injuryRisk,
        progression,
        focusAreas
      );

      return {
        success: true,
        coachingCues: personalizedCues,
        exerciseInsights: {
          competency,
          injuryRisk,
          progression
        },
        metadata: {
          exerciseType,
          coachingStyle,
          generatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error("Personalized coaching cues generation failed", {
        error: error.message,
        stack: error.stack,
        userId: request.auth?.uid
      });

      throw new HttpsError("internal", `Coaching cues generation failed: ${error.message}`);
    }
  }
);

/**
 * Adapt coaching style based on user learning patterns
 */
export const adaptCoachingStyle = onCall(
  {
    region: "us-central1",
    memory: "512MiB",
    timeoutSeconds: 30,
  },
  async (request) => {
    try {
      const { 
        learningHistory,
        currentPreferences = {},
        performanceData = []
      } = request.data;
      
      const userId = request.auth?.uid;

      if (!userId) {
        throw new HttpsError("unauthenticated", "User must be authenticated");
      }

      logger.info("Adapting coaching style", {
        userId,
        hasLearningHistory: !!learningHistory,
        performanceDataPoints: performanceData.length
      });

      // Analyze learning patterns
      const learningPatterns = analyzeLearningPatterns(learningHistory, performanceData);
      
      // Determine optimal coaching approach
      const optimalStyle = determineOptimalCoachingStyle(learningPatterns, currentPreferences);
      
      // Generate coaching adaptation recommendations
      const adaptationRecommendations = generateAdaptationRecommendations(
        learningPatterns,
        optimalStyle,
        currentPreferences
      );

      // Save adapted preferences
      await saveCoachingPreferences(userId, optimalStyle, adaptationRecommendations);

      return {
        success: true,
        optimalCoachingStyle: optimalStyle,
        learningPatterns,
        adaptationRecommendations,
        metadata: {
          adaptedAt: new Date().toISOString(),
          basedOnSessions: learningHistory?.length || 0
        }
      };

    } catch (error) {
      logger.error("Coaching style adaptation failed", {
        error: error.message,
        stack: error.stack,
        userId: request.auth?.uid
      });

      throw new HttpsError("internal", `Coaching style adaptation failed: ${error.message}`);
    }
  }
);

/**
 * Helper Functions
 */

/**
 * Analyze form competency across multiple exercises
 */
function analyzeFormCompetency(formHistory, currentCompetency) {
  if (!formHistory || Object.keys(formHistory).length === 0) {
    return {
      overall: { level: 'beginner', confidence: 'low' },
      exercises: {},
      recommendations: ['Start with bodyweight movements', 'Focus on movement fundamentals']
    };
  }

  const exerciseAnalysis = {};
  let overallScores = [];

  Object.entries(formHistory).forEach(([exerciseType, sessions]) => {
    if (sessions && sessions.length > 0) {
      const competency = calculateExerciseCompetency(sessions, exerciseType);
      exerciseAnalysis[exerciseType] = competency;
      overallScores.push(competency.score);
    }
  });

  const overallAverage = overallScores.length 
    ? overallScores.reduce((sum, score) => sum + score, 0) / overallScores.length
    : 0;

  let overallLevel = 'beginner';
  if (overallAverage >= 85) overallLevel = 'advanced';
  else if (overallAverage >= 70) overallLevel = 'intermediate';

  const confidence = calculateConfidenceLevel(overallScores);

  return {
    overall: { 
      level: overallLevel, 
      score: Math.round(overallAverage),
      confidence: confidence 
    },
    exercises: exerciseAnalysis,
    recommendations: generateGeneralRecommendations(overallLevel, exerciseAnalysis)
  };
}

/**
 * Calculate competency for specific exercise
 */
function calculateExerciseCompetency(sessions, exerciseType) {
  if (!sessions || sessions.length === 0) {
    return { level: 'beginner', score: 0, sessionCount: 0, trend: 'stable' };
  }

  const scores = sessions.map(session => session.overallScore || 0);
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  let level = 'beginner';
  if (averageScore >= 85 && scores.length >= 8) level = 'advanced';
  else if (averageScore >= 70 && scores.length >= 4) level = 'intermediate';

  const trend = calculateTrend(scores);
  const consistency = calculateConsistency(scores);

  return {
    level,
    score: Math.round(averageScore),
    sessionCount: scores.length,
    trend,
    consistency: Math.round(consistency),
    bestScore: Math.max(...scores)
  };
}

/**
 * Assess injury risks across workout based on form patterns
 */
function assessWorkoutInjuryRisks(formHistory, existingInjuries = []) {
  const risks = [];
  const recommendations = [];
  let maxRiskLevel = 'low';

  if (formHistory) {
    Object.entries(formHistory).forEach(([exerciseType, sessions]) => {
      if (sessions && sessions.length > 0) {
        // Get most recent session for risk assessment
        const recentSession = sessions[0];
        const riskAssessment = assessInjuryRisk(exerciseType, recentSession, { sessions });
        
        if (riskAssessment.level !== 'low') {
          risks.push({
            exercise: exerciseType,
            level: riskAssessment.level,
            risks: riskAssessment.risks,
            assessment: riskAssessment.assessment
          });

          recommendations.push(...riskAssessment.recommendations);

          // Update max risk level
          const riskLevels = ['low', 'medium', 'high', 'very high'];
          const currentMax = riskLevels.indexOf(maxRiskLevel);
          const newLevel = riskLevels.indexOf(riskAssessment.level);
          if (newLevel > currentMax) {
            maxRiskLevel = riskAssessment.level;
          }
        }
      }
    });
  }

  // Factor in existing injuries
  existingInjuries.forEach(injury => {
    risks.push({
      type: 'existing_injury',
      location: injury.location,
      level: injury.severity || 'medium',
      description: injury.description
    });
    recommendations.push(`Modify exercises to accommodate ${injury.location} injury`);
  });

  return {
    overallRiskLevel: maxRiskLevel,
    risks: risks,
    recommendations: [...new Set(recommendations)],
    exerciseModifications: generateExerciseModifications(risks)
  };
}

/**
 * Generate exercise recommendations based on competency and risks
 */
function generateExerciseRecommendations(competencyAnalysis, injuryRiskAssessment, targetMuscleGroups, preferences) {
  const recommendations = {
    include: [],
    modify: [],
    avoid: [],
    alternatives: []
  };

  // Analyze each exercise for recommendations
  Object.entries(competencyAnalysis.exercises).forEach(([exerciseType, competency]) => {
    const progression = getProgressionRecommendation(exerciseType, competency, competency.score);
    
    if (progression) {
      if (progression.type === 'progression') {
        recommendations.include.push({
          exercise: progression.exercise,
          reason: progression.reason,
          focusAreas: progression.focusAreas
        });
      } else if (progression.type === 'regression') {
        recommendations.modify.push({
          exercise: exerciseType,
          modification: progression.exercise,
          reason: progression.reason
        });
      } else {
        recommendations.include.push({
          exercise: exerciseType,
          reason: progression.reason,
          focusAreas: progression.focusAreas
        });
      }
    }
  });

  // Factor in injury risks
  injuryRiskAssessment.risks.forEach(risk => {
    if (risk.level === 'high' || risk.level === 'very high') {
      recommendations.avoid.push({
        exercise: risk.exercise,
        reason: risk.assessment,
        alternatives: risk.alternatives || []
      });
    } else if (risk.level === 'medium') {
      recommendations.modify.push({
        exercise: risk.exercise,
        modifications: injuryRiskAssessment.exerciseModifications[risk.exercise] || [],
        reason: risk.assessment
      });
    }
  });

  // Add muscle group specific recommendations
  if (targetMuscleGroups.length > 0) {
    const muscleGroupExercises = getMuscleGroupExercises(targetMuscleGroups, competencyAnalysis.overall.level);
    recommendations.include.push(...muscleGroupExercises);
  }

  return recommendations;
}

/**
 * Build comprehensive workout generation prompt
 */
function buildWorkoutGenerationPrompt(exerciseRecommendations, competencyAnalysis, injuryRiskAssessment, preferences, workoutType) {
  let prompt = `Generate a ${workoutType} workout based on detailed form analysis and competency assessment.\n\n`;

  prompt += `User Competency Level: ${competencyAnalysis.overall.level}\n`;
  prompt += `Overall Form Score: ${competencyAnalysis.overall.score}/100\n`;
  prompt += `Injury Risk Level: ${injuryRiskAssessment.overallRiskLevel}\n\n`;

  // Exercise-specific competencies
  if (Object.keys(competencyAnalysis.exercises).length > 0) {
    prompt += `Exercise-Specific Competencies:\n`;
    Object.entries(competencyAnalysis.exercises).forEach(([exercise, comp]) => {
      prompt += `- ${exercise}: ${comp.level} (${comp.score}/100, ${comp.sessionCount} sessions, ${comp.trend})\n`;
    });
    prompt += '\n';
  }

  // Exercise recommendations
  if (exerciseRecommendations.include.length > 0) {
    prompt += `Recommended Exercises:\n`;
    exerciseRecommendations.include.forEach(rec => {
      prompt += `- ${rec.exercise}: ${rec.reason}\n`;
      if (rec.focusAreas) prompt += `  Focus: ${rec.focusAreas.join(', ')}\n`;
    });
    prompt += '\n';
  }

  if (exerciseRecommendations.modify.length > 0) {
    prompt += `Exercise Modifications Needed:\n`;
    exerciseRecommendations.modify.forEach(mod => {
      prompt += `- ${mod.exercise} → ${mod.modification}: ${mod.reason}\n`;
    });
    prompt += '\n';
  }

  if (exerciseRecommendations.avoid.length > 0) {
    prompt += `Exercises to Avoid:\n`;
    exerciseRecommendations.avoid.forEach(avoid => {
      prompt += `- ${avoid.exercise}: ${avoid.reason}\n`;
    });
    prompt += '\n';
  }

  // Injury considerations
  if (injuryRiskAssessment.risks.length > 0) {
    prompt += `Injury Risk Considerations:\n`;
    injuryRiskAssessment.risks.forEach(risk => {
      prompt += `- ${risk.exercise || risk.type}: ${risk.level} risk - ${risk.assessment || risk.description}\n`;
    });
    prompt += '\n';
  }

  // Preferences
  if (preferences.duration) prompt += `Preferred Duration: ${preferences.duration} minutes\n`;
  if (preferences.equipment) prompt += `Available Equipment: ${preferences.equipment.join(', ')}\n`;
  if (preferences.intensity) prompt += `Intensity Level: ${preferences.intensity}\n`;

  prompt += `\nGenerate a safe, effective workout that addresses form competency levels, minimizes injury risk, and promotes proper movement patterns.`;

  return prompt;
}

/**
 * Generate AI workout using Gemini
 */
async function generateAIWorkout(prompt, userId) {
  try {
    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      }
    });

    const systemPrompt = `You are an expert strength and conditioning coach with specialized training in movement analysis and injury prevention. Generate structured workout plans that prioritize form, safety, and progressive overload based on individual competency assessments.

    Format your response as a structured workout with:
    - Warm-up (5-10 minutes)
    - Main exercises (with sets, reps, and form cues)
    - Cool-down (5-10 minutes)
    - Safety notes and modifications
    - Progressive coaching cues for each exercise`;

    const result = await model.generateContent([
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I understand. I\'ll generate safe, effective workouts based on form analysis and competency levels.' }] },
      { role: 'user', parts: [{ text: prompt }] }
    ]);

    return result.response.text();

  } catch (error) {
    logger.error('AI workout generation failed', { error: error.message, userId });
    throw new Error(`AI workout generation failed: ${error.message}`);
  }
}

/**
 * Generate personalized coaching cues using AI
 */
async function generatePersonalizedCues(coachingPrompt, formAnalysis, competency, injuryRisk, progression, focusAreas) {
  try {
    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.8,
        topP: 0.9,
      }
    });

    let prompt = coachingPrompt + '\n\n';
    
    if (formAnalysis) {
      prompt += `Current Form Analysis Results:\n`;
      prompt += `Overall Score: ${formAnalysis.overallScore}/100\n`;
      if (formAnalysis.criticalErrors) {
        prompt += `Critical Issues: ${formAnalysis.criticalErrors.map(e => e.type).join(', ')}\n`;
      }
    }

    prompt += `\nUser Competency: ${competency.level} (${competency.score}/100)\n`;
    prompt += `Injury Risk Level: ${injuryRisk.level}\n`;
    prompt += `Progression Recommendation: ${progression.type} - ${progression.recommendation}\n`;

    if (focusAreas.length > 0) {
      prompt += `Focus Areas: ${focusAreas.join(', ')}\n`;
    }

    prompt += `\nGenerate 3-5 specific, actionable coaching cues that address the current form issues while considering the user's experience level and learning style.`;

    const result = await model.generateContent(prompt);
    return result.response.text();

  } catch (error) {
    logger.error('Personalized cues generation failed', { error: error.message });
    throw new Error(`Personalized cues generation failed: ${error.message}`);
  }
}

/**
 * Helper utility functions
 */

function calculateTrend(scores) {
  if (scores.length < 2) return 'stable';
  
  const recent = scores.slice(0, Math.ceil(scores.length / 2));
  const older = scores.slice(Math.floor(scores.length / 2));
  
  const recentAvg = recent.reduce((sum, score) => sum + score, 0) / recent.length;
  const olderAvg = older.reduce((sum, score) => sum + score, 0) / older.length;
  
  const difference = recentAvg - olderAvg;
  
  if (difference > 5) return 'improving';
  if (difference < -5) return 'declining';
  return 'stable';
}

function calculateConsistency(scores) {
  if (scores.length < 2) return 100;
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  return mean > 0 ? Math.max(0, 100 - (stdDev / mean) * 100) : 0;
}

function calculateConfidenceLevel(scores) {
  if (scores.length < 3) return 'low';
  const consistency = calculateConsistency(scores);
  if (consistency >= 80) return 'high';
  if (consistency >= 60) return 'medium';
  return 'low';
}

function generateGeneralRecommendations(level, exerciseAnalysis) {
  const recommendations = [];
  
  switch (level) {
    case 'beginner':
      recommendations.push('Focus on mastering fundamental movement patterns');
      recommendations.push('Prioritize form quality over intensity');
      recommendations.push('Build consistency with basic exercises');
      break;
    case 'intermediate':
      recommendations.push('Progress to more challenging exercise variations');
      recommendations.push('Focus on movement quality and consistency');
      recommendations.push('Begin incorporating complex movement patterns');
      break;
    case 'advanced':
      recommendations.push('Focus on movement optimization and efficiency');
      recommendations.push('Incorporate advanced variations and loading patterns');
      recommendations.push('Emphasize skill transfer to sport-specific movements');
      break;
  }

  return recommendations;
}

function generateExerciseModifications(risks) {
  const modifications = {};
  
  risks.forEach(risk => {
    if (risk.exercise) {
      modifications[risk.exercise] = [
        'Reduce range of motion if needed',
        'Lower intensity/load',
        'Focus on perfect form over performance',
        'Consider alternative exercise if pain persists'
      ];
    }
  });

  return modifications;
}

function getMuscleGroupExercises(muscleGroups, level) {
  // This would be expanded with a comprehensive exercise database
  const exercises = [];
  
  muscleGroups.forEach(group => {
    switch (group.toLowerCase()) {
      case 'legs':
        if (level === 'beginner') exercises.push({ exercise: 'bodyweight_squat', reason: 'Fundamental leg movement pattern' });
        else if (level === 'intermediate') exercises.push({ exercise: 'goblet_squat', reason: 'Progressive leg strengthening' });
        else exercises.push({ exercise: 'barbell_squat', reason: 'Advanced leg development' });
        break;
      // Add more muscle groups as needed
    }
  });

  return exercises;
}

function analyzeLearningPatterns(learningHistory, performanceData) {
  // Placeholder for learning pattern analysis
  return {
    preferredFeedbackStyle: 'balanced',
    responseToCorrections: 'positive',
    learningSpeed: 'moderate',
    retentionRate: 'good'
  };
}

function determineOptimalCoachingStyle(learningPatterns, currentPreferences) {
  // Placeholder for coaching style optimization
  return {
    primaryStyle: currentPreferences.coachingStyle || 'supportive',
    communicationPreference: 'visual_and_verbal',
    feedbackFrequency: 'regular',
    motivationalApproach: 'achievement_focused'
  };
}

function generateAdaptationRecommendations(learningPatterns, optimalStyle, currentPreferences) {
  return [
    'Continue with current supportive coaching approach',
    'Increase frequency of positive reinforcement',
    'Focus on visual form cues alongside verbal instruction'
  ];
}

async function saveWorkoutContext(userId, context) {
  try {
    await db.collection('formAwareWorkouts').add({
      userId,
      ...context,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    logger.warn('Failed to save workout context', { error: error.message, userId });
  }
}

async function saveCoachingPreferences(userId, style, recommendations) {
  try {
    await db.collection('coachingPreferences').doc(userId).set({
      style,
      recommendations,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (error) {
    logger.warn('Failed to save coaching preferences', { error: error.message, userId });
  }
}