/**
 * Form-Specific Coaching Prompts
 * Specialized coaching prompts for different exercise types and form analysis scenarios
 * Issue #16 - Stream B: Enhanced AI Functions & Coaching Logic
 */

/**
 * Exercise-specific coaching prompt templates
 */
export const EXERCISE_COACHING_PROMPTS = {
  squat: {
    systemPrompt: `You are a specialized squat form coach with expertise in biomechanics and movement patterns.
Focus on depth, knee alignment, spinal positioning, and balance during the squat movement.`,
    
    commonIssues: {
      'knee_valgus': {
        identification: "Knees cave inward during descent or ascent",
        corrections: [
          "Focus on driving knees out in line with toes",
          "Strengthen glutes and hip external rotators",
          "Practice goblet squats to reinforce proper knee tracking"
        ],
        progressions: [
          "Wall sits with band around knees",
          "Goblet squats with pause",
          "Single-leg glute bridges"
        ],
        injuryRisk: "high - knee and hip joint stress, potential ACL strain"
      },
      
      'forward_lean': {
        identification: "Excessive forward trunk lean during movement",
        corrections: [
          "Keep chest proud and core engaged",
          "Focus on sitting back rather than bending forward",
          "Work on ankle mobility and hip flexibility"
        ],
        progressions: [
          "Box squats to teach proper hip hinge",
          "Heel-elevated squats for ankle mobility",
          "Thoracic spine mobility work"
        ],
        injuryRisk: "medium - lower back strain, disc compression"
      },
      
      'shallow_depth': {
        identification: "Not reaching proper squat depth (hip crease below knee)",
        corrections: [
          "Focus on sitting back and down fully",
          "Work on hip and ankle flexibility",
          "Use box squats to practice proper depth"
        ],
        progressions: [
          "Assisted squats to depth",
          "Heel-elevated squats",
          "Hip flexor stretches and mobility work"
        ],
        injuryRisk: "low - reduced exercise effectiveness"
      },
      
      'heel_rise': {
        identification: "Heels lift off ground during descent",
        corrections: [
          "Keep weight distributed across entire foot",
          "Improve ankle dorsiflexion mobility",
          "Consider heel-elevated squats temporarily"
        ],
        progressions: [
          "Calf stretches and ankle mobility",
          "Wall ankle stretches",
          "Gradual heel elevation reduction"
        ],
        injuryRisk: "medium - ankle instability, altered force distribution"
      }
    },
    
    progressionCues: {
      beginner: [
        "Start with bodyweight and focus on movement pattern",
        "Use a mirror to check form",
        "Practice sitting back onto a box or bench",
        "Keep movements slow and controlled"
      ],
      intermediate: [
        "Add pauses at the bottom to improve mobility",
        "Focus on consistent depth and speed",
        "Work on unilateral variations",
        "Add external load gradually"
      ],
      advanced: [
        "Focus on explosive ascent while maintaining form",
        "Work on complex variations and load progressions",
        "Analyze movement efficiency and optimization",
        "Integrate plyometric elements safely"
      ]
    }
  },

  deadlift: {
    systemPrompt: `You are a specialized deadlift form coach with expertise in posterior chain mechanics and spinal safety.
Focus on hip hinge pattern, neutral spine, and proper bar path during the deadlift movement.`,
    
    commonIssues: {
      'rounded_back': {
        identification: "Lumbar or thoracic spine rounds during lift",
        corrections: [
          "Engage lats and keep chest proud",
          "Focus on hip hinge pattern, not squatting",
          "Keep bar close to body throughout movement"
        ],
        progressions: [
          "Romanian deadlifts to learn hip hinge",
          "Rack pulls from elevated position",
          "Cat-cow stretches for spinal mobility"
        ],
        injuryRisk: "very high - disc herniation, spinal injury"
      },
      
      'bar_drift': {
        identification: "Bar moves away from body during lift",
        corrections: [
          "Keep bar in contact with legs throughout movement",
          "Engage lats to pull bar back",
          "Focus on vertical bar path"
        ],
        progressions: [
          "Deadlifts with pause just off floor",
          "Romanian deadlifts focusing on bar contact",
          "Lat strengthening exercises"
        ],
        injuryRisk: "high - increased moment arm, back strain"
      },
      
      'knee_lockout_early': {
        identification: "Knees extend before hips, creating stiff-leg position",
        corrections: [
          "Drive through heels and extend hips and knees together",
          "Think about standing up straight, not lifting with back",
          "Practice timing with lighter weight"
        ],
        progressions: [
          "Pause deadlifts at knee level",
          "Deficit deadlifts for full range",
          "Hip thrust to strengthen hip extension"
        ],
        injuryRisk: "high - excessive lower back stress"
      }
    },
    
    progressionCues: {
      beginner: [
        "Start with Romanian deadlifts to learn hip hinge",
        "Focus on keeping bar close to body",
        "Practice setup position repeatedly",
        "Use light weight until form is mastered"
      ],
      intermediate: [
        "Work on timing of hip and knee extension",
        "Add pauses to strengthen sticking points",
        "Practice different grip variations",
        "Focus on consistent bar path"
      ],
      advanced: [
        "Optimize setup for maximum mechanical advantage",
        "Work on speed off the floor while maintaining form",
        "Analyze individual leverages and technique",
        "Integrate accessory work for weak points"
      ]
    }
  },

  push_up: {
    systemPrompt: `You are a specialized push-up form coach focusing on core stability, scapular control, and proper pushing mechanics.
Emphasize full-body tension and proper movement sequencing.`,
    
    commonIssues: {
      'sagging_hips': {
        identification: "Hips drop below neutral spine alignment",
        corrections: [
          "Engage core muscles throughout movement",
          "Think about maintaining plank position",
          "Practice holding plank position first"
        ],
        progressions: [
          "Plank holds building to 60 seconds",
          "Incline push-ups with focus on core",
          "Dead bug exercises for core stability"
        ],
        injuryRisk: "medium - lower back strain, poor movement pattern"
      },
      
      'partial_range': {
        identification: "Not lowering chest fully or not extending arms completely",
        corrections: [
          "Lower until chest nearly touches ground",
          "Extend arms fully at top position",
          "Control the eccentric portion of movement"
        ],
        progressions: [
          "Incline push-ups for proper range",
          "Negative push-ups (slow lowering)",
          "Push-up to downward dog for mobility"
        ],
        injuryRisk: "low - reduced exercise effectiveness"
      },
      
      'head_forward': {
        identification: "Head extends forward, breaking neutral spine",
        corrections: [
          "Keep head in line with spine",
          "Look at ground about 12 inches in front",
          "Think about lengthening back of neck"
        ],
        progressions: [
          "Wall push-ups focusing on head position",
          "Cervical spine stretches",
          "Upper back strengthening exercises"
        ],
        injuryRisk: "medium - neck strain, poor posture reinforcement"
      }
    },
    
    progressionCues: {
      beginner: [
        "Start with wall push-ups or incline variations",
        "Focus on maintaining straight body line",
        "Build up plank hold strength first",
        "Practice proper hand placement"
      ],
      intermediate: [
        "Work toward full range of motion push-ups",
        "Add pauses at bottom position",
        "Practice different hand positions",
        "Focus on controlled movement speed"
      ],
      advanced: [
        "Add challenging variations (single-arm, plyometric)",
        "Focus on explosive concentric movement",
        "Work on unilateral and unstable surface variations",
        "Integrate push-ups into complex movement patterns"
      ]
    }
  }
};

/**
 * Generate exercise-specific coaching prompt based on form analysis
 */
export function generateCoachingPrompt(exerciseType, formAnalysis, userLevel = 'beginner', coachingStyle = 'supportive') {
  const exercisePrompts = EXERCISE_COACHING_PROMPTS[exerciseType];
  if (!exercisePrompts) {
    return generateGenericCoachingPrompt(exerciseType, formAnalysis, userLevel, coachingStyle);
  }

  let prompt = exercisePrompts.systemPrompt + '\n\n';

  // Add user level specific guidance
  const levelCues = exercisePrompts.progressionCues[userLevel];
  if (levelCues) {
    prompt += `For ${userLevel} level athletes, focus on:\n${levelCues.map(cue => `- ${cue}`).join('\n')}\n\n`;
  }

  // Add specific issue guidance if form analysis indicates problems
  if (formAnalysis && formAnalysis.criticalErrors) {
    prompt += 'Address these specific form issues:\n';
    formAnalysis.criticalErrors.forEach(error => {
      const issueInfo = findIssueInfo(exercisePrompts.commonIssues, error.type);
      if (issueInfo) {
        prompt += `\n${error.type.toUpperCase()}:\n`;
        prompt += `- Problem: ${issueInfo.identification}\n`;
        prompt += `- Corrections: ${issueInfo.corrections.join(', ')}\n`;
        prompt += `- Risk Level: ${issueInfo.injuryRisk}\n`;
      }
    });
  }

  // Add coaching style modification
  prompt += `\n\nCoaching Style: ${coachingStyle}`;
  const styleGuidance = getCoachingStyleGuidance(coachingStyle, userLevel);
  if (styleGuidance) {
    prompt += `\n${styleGuidance}`;
  }

  return prompt;
}

/**
 * Find issue information from exercise-specific common issues
 */
function findIssueInfo(commonIssues, errorType) {
  // Try exact match first
  if (commonIssues[errorType]) {
    return commonIssues[errorType];
  }

  // Try fuzzy matching
  const errorTypeLower = errorType.toLowerCase();
  for (const [issueKey, issueInfo] of Object.entries(commonIssues)) {
    if (issueKey.toLowerCase().includes(errorTypeLower) || 
        errorTypeLower.includes(issueKey.toLowerCase())) {
      return issueInfo;
    }
  }

  return null;
}

/**
 * Generate generic coaching prompt for unsupported exercises
 */
function generateGenericCoachingPrompt(exerciseType, formAnalysis, userLevel, coachingStyle) {
  let prompt = `You are coaching ${exerciseType} form analysis. Focus on proper movement mechanics, safety, and progressive improvement.\n\n`;

  if (formAnalysis && formAnalysis.criticalErrors && formAnalysis.criticalErrors.length > 0) {
    prompt += 'Current form issues to address:\n';
    formAnalysis.criticalErrors.forEach(error => {
      prompt += `- ${error.type}: ${error.description}\n`;
      prompt += `  Correction: ${error.correction}\n`;
    });
    prompt += '\n';
  }

  prompt += `User Level: ${userLevel}\n`;
  prompt += `Coaching Style: ${coachingStyle}\n`;

  const styleGuidance = getCoachingStyleGuidance(coachingStyle, userLevel);
  if (styleGuidance) {
    prompt += `${styleGuidance}\n`;
  }

  return prompt;
}

/**
 * Get coaching style specific guidance
 */
function getCoachingStyleGuidance(style, level) {
  const guidance = {
    supportive: {
      beginner: "Use encouraging language, celebrate small improvements, focus on building confidence while learning basics",
      intermediate: "Balance encouragement with challenge, acknowledge progress while pushing for consistency",
      advanced: "Focus on refinement and optimization, acknowledge expertise while challenging limits"
    },
    direct: {
      beginner: "Give clear, simple instructions, focus on one correction at a time, be patient but precise",
      intermediate: "Provide specific, actionable feedback, address multiple areas simultaneously when appropriate",
      advanced: "Give precise corrections, discuss advanced techniques, be straightforward about optimization opportunities"
    },
    technical: {
      beginner: "Explain the 'why' behind movements, use simple anatomical references, build understanding gradually",
      intermediate: "Use technical terminology appropriately, reference biomechanics and performance theory",
      advanced: "Use professional terminology, discuss complex movement patterns, analyze efficiency and mechanics"
    }
  };

  return guidance[style]?.[level] || '';
}

/**
 * Exercise progression recommendations based on form competency
 */
export const EXERCISE_PROGRESSIONS = {
  squat: {
    prerequisites: ['bodyweight_squat', 'goblet_squat', 'wall_sit'],
    progressions: [
      {
        name: 'Bodyweight Squat',
        criteria: { overallScore: 70, sessionCount: 3 },
        nextExercise: 'goblet_squat',
        focus: ['depth', 'knee_alignment', 'balance']
      },
      {
        name: 'Goblet Squat',
        criteria: { overallScore: 75, sessionCount: 5 },
        nextExercise: 'front_squat',
        focus: ['load_tolerance', 'core_stability', 'timing']
      },
      {
        name: 'Front Squat',
        criteria: { overallScore: 80, sessionCount: 8 },
        nextExercise: 'back_squat',
        focus: ['thoracic_mobility', 'core_strength', 'balance']
      }
    ],
    regressions: [
      { trigger: { overallScore: 60 }, recommendation: 'box_squat' },
      { trigger: { overallScore: 50 }, recommendation: 'wall_squat' },
      { trigger: { overallScore: 40 }, recommendation: 'assisted_squat' }
    ]
  },

  deadlift: {
    prerequisites: ['hip_hinge_pattern', 'romanian_deadlift', 'rack_pull'],
    progressions: [
      {
        name: 'Romanian Deadlift',
        criteria: { overallScore: 75, sessionCount: 5 },
        nextExercise: 'rack_pull',
        focus: ['hip_hinge', 'hamstring_flexibility', 'bar_contact']
      },
      {
        name: 'Rack Pull',
        criteria: { overallScore: 80, sessionCount: 6 },
        nextExercise: 'conventional_deadlift',
        focus: ['lockout_strength', 'grip_strength', 'spinal_stability']
      }
    ],
    regressions: [
      { trigger: { overallScore: 65 }, recommendation: 'romanian_deadlift' },
      { trigger: { overallScore: 55 }, recommendation: 'single_leg_rdl' },
      { trigger: { overallScore: 45 }, recommendation: 'hip_hinge_practice' }
    ]
  },

  push_up: {
    prerequisites: ['plank', 'wall_push_up', 'incline_push_up'],
    progressions: [
      {
        name: 'Wall Push-up',
        criteria: { overallScore: 70, sessionCount: 3 },
        nextExercise: 'incline_push_up',
        focus: ['body_alignment', 'push_pattern', 'core_stability']
      },
      {
        name: 'Incline Push-up',
        criteria: { overallScore: 75, sessionCount: 5 },
        nextExercise: 'knee_push_up',
        focus: ['increased_load', 'range_of_motion', 'control']
      },
      {
        name: 'Knee Push-up',
        criteria: { overallScore: 80, sessionCount: 8 },
        nextExercise: 'full_push_up',
        focus: ['full_body_tension', 'strength_building', 'form_consistency']
      }
    ],
    regressions: [
      { trigger: { overallScore: 60 }, recommendation: 'incline_push_up' },
      { trigger: { overallScore: 50 }, recommendation: 'wall_push_up' },
      { trigger: { overallScore: 40 }, recommendation: 'plank_hold' }
    ]
  }
};

/**
 * Get exercise progression recommendation based on current competency
 */
export function getProgressionRecommendation(exerciseType, competencyData, currentFormScore) {
  const progressions = EXERCISE_PROGRESSIONS[exerciseType];
  if (!progressions) return null;

  const { level, score, sessionCount } = competencyData;
  
  // Check for regressions first if current form is poor
  if (currentFormScore < 70) {
    for (const regression of progressions.regressions) {
      if (currentFormScore <= regression.trigger.overallScore) {
        return {
          type: 'regression',
          exercise: regression.recommendation,
          reason: `Current form score (${currentFormScore}) indicates need to master fundamentals`,
          recommendation: `Focus on ${regression.recommendation} to build proper movement pattern`
        };
      }
    }
  }

  // Check for progressions
  for (const progression of progressions.progressions) {
    if (score >= progression.criteria.overallScore && 
        sessionCount >= progression.criteria.sessionCount) {
      return {
        type: 'progression',
        exercise: progression.nextExercise,
        reason: `Strong performance (${score}/100) over ${sessionCount} sessions indicates readiness`,
        recommendation: `Progress to ${progression.nextExercise}, focusing on: ${progression.focus.join(', ')}`,
        focusAreas: progression.focus
      };
    }
  }

  // Continue current exercise with focus areas
  return {
    type: 'maintain',
    exercise: exerciseType,
    reason: 'Continue building competency with current exercise',
    recommendation: `Keep practicing ${exerciseType} with focus on consistency and form refinement`,
    focusAreas: progressions.progressions[0]?.focus || ['general_form']
  };
}

/**
 * Generate injury risk assessment based on form analysis
 */
export function assessInjuryRisk(exerciseType, formAnalysis, userHistory = {}) {
  if (!formAnalysis || !formAnalysis.criticalErrors) {
    return { level: 'low', risks: [], recommendations: [] };
  }

  const exercisePrompts = EXERCISE_COACHING_PROMPTS[exerciseType];
  if (!exercisePrompts) return { level: 'low', risks: [], recommendations: [] };

  let maxRiskLevel = 'low';
  const risks = [];
  const recommendations = [];

  formAnalysis.criticalErrors.forEach(error => {
    const issueInfo = findIssueInfo(exercisePrompts.commonIssues, error.type);
    if (issueInfo && issueInfo.injuryRisk) {
      const riskInfo = issueInfo.injuryRisk.split(' - ');
      const level = riskInfo[0];
      const description = riskInfo[1] || '';

      risks.push({
        error: error.type,
        level: level,
        description: description,
        frequency: error.frequency || 1
      });

      recommendations.push(...issueInfo.progressions);

      // Update max risk level
      const riskLevels = ['low', 'medium', 'high', 'very high'];
      const currentMax = riskLevels.indexOf(maxRiskLevel);
      const newLevel = riskLevels.indexOf(level);
      if (newLevel > currentMax) {
        maxRiskLevel = level;
      }
    }
  });

  return {
    level: maxRiskLevel,
    risks: risks,
    recommendations: [...new Set(recommendations)], // Remove duplicates
    assessment: generateRiskAssessment(maxRiskLevel, risks.length)
  };
}

/**
 * Generate human-readable risk assessment
 */
function generateRiskAssessment(riskLevel, riskCount) {
  const assessments = {
    'low': 'Form issues present minimal injury risk. Continue with current program while addressing minor corrections.',
    'medium': `${riskCount} form issue${riskCount > 1 ? 's' : ''} present moderate injury risk. Address these issues before increasing intensity or load.`,
    'high': `${riskCount} form issue${riskCount > 1 ? 's' : ''} present significant injury risk. Focus on corrections before continuing with this exercise.`,
    'very high': `Critical form issues identified. Stop current exercise and work on foundational movement patterns with qualified supervision.`
  };

  return assessments[riskLevel] || assessments.low;
}