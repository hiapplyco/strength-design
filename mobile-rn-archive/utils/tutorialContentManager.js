/**
 * Tutorial Content Manager
 * Modular content system for managing tutorial content structure, validation, and organization
 * Supports dynamic content loading, content templates, and extensible content types
 */

import tutorialService from '../services/tutorialService';
import contentDeliveryService from '../services/contentDeliveryService';

/**
 * Content types supported by the tutorial system
 */
export const CONTENT_TYPES = {
  VIDEO: 'video',
  IMAGE: 'image',
  TEXT: 'text',
  INTERACTIVE: 'interactive',
  QUIZ: 'quiz',
  CHECKLIST: 'checklist',
  TIPS: 'tips',
  WARNING: 'warning'
};

/**
 * Difficulty levels
 */
export const DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced'
};

/**
 * Content categories for pose analysis tutorials
 */
export const TUTORIAL_CATEGORIES = {
  EXERCISE_TECHNIQUES: 'exercise-techniques',
  RECORDING_PRACTICES: 'recording-best-practices',
  COMMON_MISTAKES: 'common-mistakes',
  PROGRESSIVE_MOVEMENTS: 'progressive-movements',
  APP_WALKTHROUGH: 'app-walkthrough'
};

/**
 * Exercise types for technique tutorials
 */
export const EXERCISE_TYPES = {
  SQUAT: 'squat',
  DEADLIFT: 'deadlift',
  PUSH_UP: 'push_up',
  BENCH_PRESS: 'bench_press',
  OVERHEAD_PRESS: 'overhead_press'
};

/**
 * Tutorial Content Manager Class
 * Provides high-level content management and organization capabilities
 */
class TutorialContentManager {
  constructor() {
    this.contentTemplates = new Map();
    this.contentValidators = new Map();
    this.contentProcessors = new Map();
    this.customComponents = new Map();
    this.isInitialized = false;
    
    // Initialize built-in content types
    this.initializeContentTypes();
    this.initializeContentTemplates();
    this.initializeValidators();
  }

  /**
   * Initialize the content manager
   */
  async initialize() {
    try {
      console.log('🎯 Initializing Tutorial Content Manager...');
      
      // Initialize base services
      await tutorialService.initialize();
      await contentDeliveryService.initialize();
      
      this.isInitialized = true;
      console.log('✅ Tutorial Content Manager initialized');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error initializing Tutorial Content Manager:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get structured tutorial content for a specific exercise technique
   */
  async getExerciseTechniqueTutorial(exerciseType, options = {}) {
    try {
      const {
        includeCommonMistakes = true,
        includeProgressions = true,
        userLevel = 'beginner'
      } = options;

      // Get base technique content
      const baseContent = await this.getContentByTemplate('exercise-technique', {
        exerciseType,
        userLevel
      });

      // Add progressive difficulty content
      if (includeProgressions) {
        const progressions = await this.getProgressionContent(exerciseType, userLevel);
        baseContent.progressions = progressions;
      }

      // Add common mistakes section
      if (includeCommonMistakes) {
        const mistakes = await this.getCommonMistakesContent(exerciseType);
        baseContent.commonMistakes = mistakes;
      }

      // Process media content
      baseContent.media = await this.processMediaContent(baseContent.media || []);

      return baseContent;
    } catch (error) {
      console.error('❌ Error getting exercise technique tutorial:', error);
      throw error;
    }
  }

  /**
   * Get recording best practices tutorial
   */
  async getRecordingPracticesTutorial(options = {}) {
    try {
      const {
        deviceType = 'mobile', // 'mobile', 'tablet', 'webcam'
        environment = 'indoor', // 'indoor', 'outdoor'
        exerciseTypes = []
      } = options;

      const content = await this.getContentByTemplate('recording-practices', {
        deviceType,
        environment,
        exerciseTypes
      });

      // Add device-specific tips
      const deviceTips = await this.getDeviceSpecificTips(deviceType);
      content.deviceTips = deviceTips;

      // Add lighting setup guidance
      const lightingGuide = await this.getLightingSetupGuide(environment);
      content.lightingGuide = lightingGuide;

      // Add camera angle demonstrations
      const angleGuides = await this.getCameraAngleGuides(exerciseTypes);
      content.cameraAngles = angleGuides;

      return content;
    } catch (error) {
      console.error('❌ Error getting recording practices tutorial:', error);
      throw error;
    }
  }

  /**
   * Get personalized tutorial recommendations
   */
  async getPersonalizedTutorials(userProfile, options = {}) {
    try {
      const {
        limit = 5,
        categories = null,
        excludeCompleted = true
      } = options;

      // Analyze user competency and progress
      const competencyAnalysis = await this.analyzeUserCompetency(userProfile);
      
      // Get base recommendations
      const recommendations = await tutorialService.getRecommendedTutorials({
        limit: limit * 2, // Get more to filter
        excludeCompleted,
        includeProgressive: true
      });

      // Apply personalization
      const personalizedContent = await Promise.all(
        recommendations.slice(0, limit).map(async (content) => {
          // Customize content based on user profile
          const customizedContent = await this.personalizeContent(content, userProfile, competencyAnalysis);
          
          // Add user-specific tips and modifications
          const userSpecificTips = await this.generateUserSpecificTips(content, userProfile);
          customizedContent.personalizedTips = userSpecificTips;
          
          return customizedContent;
        })
      );

      return {
        recommendations: personalizedContent,
        competencyAnalysis,
        totalAvailable: recommendations.length
      };
    } catch (error) {
      console.error('❌ Error getting personalized tutorials:', error);
      return { recommendations: [], competencyAnalysis: null, totalAvailable: 0 };
    }
  }

  /**
   * Create interactive learning path for user
   */
  async createLearningPath(userProfile, goal, options = {}) {
    try {
      const {
        timeframe = 'weeks', // 'days', 'weeks', 'months'
        intensity = 'moderate', // 'light', 'moderate', 'intensive'
        focusAreas = []
      } = options;

      console.log('📚 Creating learning path for goal:', goal);

      // Analyze user's current competency
      const competency = await this.analyzeUserCompetency(userProfile);
      
      // Define learning objectives
      const objectives = await this.defineLearningObjectives(goal, competency, focusAreas);
      
      // Structure learning path
      const learningPath = {
        id: `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: this.generatePathTitle(goal, competency.level),
        description: this.generatePathDescription(goal, objectives),
        userProfile,
        goal,
        timeframe,
        intensity,
        estimatedDuration: this.calculatePathDuration(objectives, intensity),
        
        // Learning structure
        phases: await this.createLearningPhases(objectives, competency),
        milestones: this.defineMilestones(objectives),
        
        // Tracking
        progress: {
          currentPhase: 0,
          completedObjectives: [],
          totalProgress: 0,
          startedAt: new Date(),
          lastAccessed: new Date()
        },
        
        createdAt: new Date()
      };

      return learningPath;
    } catch (error) {
      console.error('❌ Error creating learning path:', error);
      throw error;
    }
  }

  /**
   * Validate and sanitize tutorial content
   */
  validateContent(content, contentType = CONTENT_TYPES.TEXT) {
    try {
      const validator = this.contentValidators.get(contentType);
      if (!validator) {
        throw new Error(`No validator found for content type: ${contentType}`);
      }

      return validator(content);
    } catch (error) {
      console.error('❌ Content validation failed:', error);
      throw error;
    }
  }

  /**
   * Process and optimize content for delivery
   */
  async processContent(content, options = {}) {
    try {
      const {
        userLevel = 'beginner',
        networkCondition = 'good',
        deviceType = 'mobile'
      } = options;

      // Apply content processors
      let processedContent = { ...content };

      for (const [processorType, processor] of this.contentProcessors.entries()) {
        if (content.types && content.types.includes(processorType)) {
          processedContent = await processor(processedContent, options);
        }
      }

      // Optimize media delivery
      if (processedContent.media) {
        processedContent.media = await this.optimizeMediaDelivery(
          processedContent.media,
          { networkCondition, deviceType }
        );
      }

      // Add interactive elements if applicable
      if (processedContent.interactiveElements) {
        processedContent.interactiveElements = await this.processInteractiveElements(
          processedContent.interactiveElements,
          { userLevel, deviceType }
        );
      }

      return processedContent;
    } catch (error) {
      console.error('❌ Error processing content:', error);
      throw error;
    }
  }

  /**
   * Generate dynamic content based on user context
   */
  async generateDynamicContent(template, context) {
    try {
      const processor = this.contentProcessors.get('dynamic');
      if (!processor) {
        throw new Error('Dynamic content processor not found');
      }

      const dynamicContent = await processor(template, context);
      
      // Validate generated content
      const validatedContent = this.validateContent(dynamicContent, dynamicContent.type);
      
      return validatedContent;
    } catch (error) {
      console.error('❌ Error generating dynamic content:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  /**
   * Initialize built-in content types
   */
  initializeContentTypes() {
    // Video content processor
    this.contentProcessors.set(CONTENT_TYPES.VIDEO, async (content, options) => {
      const { networkCondition = 'good' } = options;
      
      if (content.videoUrl) {
        const optimizedUrl = await contentDeliveryService.getContentUrl(
          content.videoUrl,
          { quality: this.getOptimalVideoQuality(networkCondition) }
        );
        content.optimizedVideoUrl = optimizedUrl.url;
        content.videoSource = optimizedUrl.source;
      }
      
      return content;
    });

    // Image content processor
    this.contentProcessors.set(CONTENT_TYPES.IMAGE, async (content, options) => {
      const { deviceType = 'mobile' } = options;
      
      if (content.images) {
        content.optimizedImages = await Promise.all(
          content.images.map(async (img) => {
            const optimized = await contentDeliveryService.getContentUrl(
              img.url,
              { quality: this.getOptimalImageQuality(deviceType) }
            );
            return {
              ...img,
              optimizedUrl: optimized.url,
              source: optimized.source
            };
          })
        );
      }
      
      return content;
    });

    // Interactive content processor
    this.contentProcessors.set(CONTENT_TYPES.INTERACTIVE, async (content, options) => {
      const { userLevel = 'beginner' } = options;
      
      // Adjust interactivity based on user level
      if (content.interactions) {
        content.processedInteractions = content.interactions.map(interaction => ({
          ...interaction,
          complexity: this.adjustComplexityForUser(interaction.complexity, userLevel),
          hints: userLevel === 'beginner' ? interaction.hints : undefined
        }));
      }
      
      return content;
    });

    // Dynamic content processor
    this.contentProcessors.set('dynamic', async (template, context) => {
      // Template variable replacement
      let processedContent = JSON.parse(JSON.stringify(template));
      
      // Replace template variables with context values
      const templateString = JSON.stringify(processedContent);
      const processedString = templateString.replace(
        /\{\{(\w+)\}\}/g,
        (match, variable) => context[variable] || match
      );
      
      processedContent = JSON.parse(processedString);
      
      // Add context-specific modifications
      if (context.userLevel) {
        processedContent = this.adjustContentForLevel(processedContent, context.userLevel);
      }
      
      return processedContent;
    });
  }

  /**
   * Initialize content templates
   */
  initializeContentTemplates() {
    // Exercise technique template
    this.contentTemplates.set('exercise-technique', {
      id: 'template_exercise_technique',
      title: '{{exerciseType}} Technique Guide',
      type: CONTENT_TYPES.VIDEO,
      category: TUTORIAL_CATEGORIES.EXERCISE_TECHNIQUES,
      structure: [
        {
          section: 'introduction',
          type: CONTENT_TYPES.TEXT,
          content: 'Learn proper {{exerciseType}} technique for optimal performance and injury prevention.'
        },
        {
          section: 'demonstration',
          type: CONTENT_TYPES.VIDEO,
          content: {
            videoUrl: 'tutorials/exercises/{{exerciseType}}/demonstration.mp4',
            duration: 300,
            keyPoints: [
              'Proper stance and setup',
              'Movement execution',
              'Breathing technique',
              'Common form cues'
            ]
          }
        },
        {
          section: 'breakdown',
          type: CONTENT_TYPES.TEXT,
          content: 'Step-by-step breakdown of the {{exerciseType}} movement pattern.'
        },
        {
          section: 'tips',
          type: CONTENT_TYPES.TIPS,
          content: [
            'Focus on controlled movement',
            'Maintain proper alignment',
            'Start with bodyweight or light resistance',
            'Film yourself to check form'
          ]
        }
      ]
    });

    // Recording practices template
    this.contentTemplates.set('recording-practices', {
      id: 'template_recording_practices',
      title: 'Video Recording Best Practices',
      type: CONTENT_TYPES.INTERACTIVE,
      category: TUTORIAL_CATEGORIES.RECORDING_PRACTICES,
      structure: [
        {
          section: 'setup',
          type: CONTENT_TYPES.VIDEO,
          content: {
            videoUrl: 'tutorials/recording/setup_{{deviceType}}.mp4',
            title: 'Camera Setup for {{deviceType}}'
          }
        },
        {
          section: 'lighting',
          type: CONTENT_TYPES.INTERACTIVE,
          content: {
            title: 'Lighting Setup Guide',
            interactions: [
              {
                type: 'comparison',
                good: 'tutorials/recording/lighting_good.jpg',
                bad: 'tutorials/recording/lighting_bad.jpg',
                explanation: 'Good lighting creates clear contrast and visibility'
              }
            ]
          }
        },
        {
          section: 'angles',
          type: CONTENT_TYPES.VIDEO,
          content: {
            videoUrl: 'tutorials/recording/camera_angles.mp4',
            title: 'Optimal Camera Angles'
          }
        },
        {
          section: 'checklist',
          type: CONTENT_TYPES.CHECKLIST,
          content: [
            'Camera at appropriate height',
            'Clear view of full body',
            'Good lighting on subject',
            'Stable camera position',
            'Clear background'
          ]
        }
      ]
    });

    // Common mistakes template
    this.contentTemplates.set('common-mistakes', {
      id: 'template_common_mistakes',
      title: 'Common {{exerciseType}} Mistakes',
      type: CONTENT_TYPES.WARNING,
      category: TUTORIAL_CATEGORIES.COMMON_MISTAKES,
      structure: [
        {
          section: 'overview',
          type: CONTENT_TYPES.TEXT,
          content: 'Learn to identify and correct common {{exerciseType}} mistakes.'
        },
        {
          section: 'mistakes',
          type: CONTENT_TYPES.INTERACTIVE,
          content: {
            interactions: [
              {
                type: 'before-after',
                before: {
                  video: 'tutorials/mistakes/{{exerciseType}}/incorrect.mp4',
                  title: 'Common Mistake'
                },
                after: {
                  video: 'tutorials/mistakes/{{exerciseType}}/correct.mp4',
                  title: 'Corrected Form'
                },
                explanation: 'Key corrections to improve form and safety'
              }
            ]
          }
        }
      ]
    });
  }

  /**
   * Initialize content validators
   */
  initializeValidators() {
    // Text content validator
    this.contentValidators.set(CONTENT_TYPES.TEXT, (content) => {
      if (!content || typeof content !== 'string') {
        throw new Error('Text content must be a non-empty string');
      }
      
      // Sanitize and validate
      const sanitized = content.trim();
      if (sanitized.length === 0) {
        throw new Error('Text content cannot be empty');
      }
      
      return sanitized;
    });

    // Video content validator
    this.contentValidators.set(CONTENT_TYPES.VIDEO, (content) => {
      if (!content || typeof content !== 'object') {
        throw new Error('Video content must be an object');
      }
      
      if (!content.videoUrl) {
        throw new Error('Video content must have a videoUrl');
      }
      
      // Validate required properties
      const validated = {
        videoUrl: content.videoUrl,
        title: content.title || 'Untitled Video',
        duration: content.duration || 0,
        thumbnail: content.thumbnail || null,
        subtitles: content.subtitles || null,
        keyPoints: Array.isArray(content.keyPoints) ? content.keyPoints : []
      };
      
      return validated;
    });

    // Interactive content validator
    this.contentValidators.set(CONTENT_TYPES.INTERACTIVE, (content) => {
      if (!content || typeof content !== 'object') {
        throw new Error('Interactive content must be an object');
      }
      
      if (!content.interactions || !Array.isArray(content.interactions)) {
        throw new Error('Interactive content must have an interactions array');
      }
      
      // Validate each interaction
      const validatedInteractions = content.interactions.map(interaction => {
        if (!interaction.type) {
          throw new Error('Each interaction must have a type');
        }
        return interaction;
      });
      
      return {
        ...content,
        interactions: validatedInteractions
      };
    });
  }

  /**
   * Get content using template
   */
  async getContentByTemplate(templateId, variables = {}) {
    const template = this.contentTemplates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Generate content from template
    const content = await this.generateDynamicContent(template, variables);
    
    return content;
  }

  /**
   * Get progression content for exercise
   */
  async getProgressionContent(exerciseType, userLevel) {
    const progressions = {
      [EXERCISE_TYPES.SQUAT]: {
        beginner: ['bodyweight-squat', 'assisted-squat', 'wall-squat'],
        intermediate: ['goblet-squat', 'front-squat', 'back-squat'],
        advanced: ['pistol-squat', 'jump-squat', 'weighted-squat']
      },
      [EXERCISE_TYPES.PUSH_UP]: {
        beginner: ['wall-pushup', 'incline-pushup', 'knee-pushup'],
        intermediate: ['standard-pushup', 'wide-pushup', 'diamond-pushup'],
        advanced: ['one-arm-pushup', 'handstand-pushup', 'clapping-pushup']
      }
      // Add more exercises as needed
    };

    const exerciseProgressions = progressions[exerciseType];
    if (!exerciseProgressions) return [];

    const levelProgressions = exerciseProgressions[userLevel] || [];
    
    return levelProgressions.map(progression => ({
      id: progression,
      name: this.formatProgressionName(progression),
      videoUrl: `tutorials/progressions/${exerciseType}/${progression}.mp4`,
      difficulty: userLevel,
      estimatedDuration: 60
    }));
  }

  /**
   * Get common mistakes content for exercise
   */
  async getCommonMistakesContent(exerciseType) {
    const mistakes = {
      [EXERCISE_TYPES.SQUAT]: [
        {
          mistake: 'knees-caving-in',
          title: 'Knees Caving Inward',
          description: 'Knees collapsing inward during the squat',
          correction: 'Focus on pushing knees out over toes',
          severity: 'high'
        },
        {
          mistake: 'forward-lean',
          title: 'Excessive Forward Lean',
          description: 'Leaning too far forward during descent',
          correction: 'Keep chest up and maintain upright torso',
          severity: 'medium'
        }
      ],
      [EXERCISE_TYPES.PUSH_UP]: [
        {
          mistake: 'sagging-hips',
          title: 'Sagging Hips',
          description: 'Hips dropping below body line',
          correction: 'Engage core and maintain straight line',
          severity: 'high'
        },
        {
          mistake: 'partial-range',
          title: 'Partial Range of Motion',
          description: 'Not lowering chest to ground',
          correction: 'Lower until chest nearly touches ground',
          severity: 'medium'
        }
      ]
    };

    const exerciseMistakes = mistakes[exerciseType] || [];
    
    return exerciseMistakes.map(mistake => ({
      ...mistake,
      videoUrl: `tutorials/mistakes/${exerciseType}/${mistake.mistake}.mp4`,
      correctVideoUrl: `tutorials/corrections/${exerciseType}/${mistake.mistake}.mp4`
    }));
  }

  /**
   * Process media content for delivery optimization
   */
  async processMediaContent(mediaList) {
    const processedMedia = await Promise.all(
      mediaList.map(async (media) => {
        try {
          const optimizedUrl = await contentDeliveryService.getContentUrl(
            media.url,
            { quality: 'auto', allowCache: true }
          );
          
          return {
            ...media,
            optimizedUrl: optimizedUrl.url,
            source: optimizedUrl.source,
            cached: optimizedUrl.cached
          };
        } catch (error) {
          console.warn('⚠️ Failed to optimize media:', media.url, error);
          return media; // Return original if optimization fails
        }
      })
    );

    return processedMedia;
  }

  /**
   * Analyze user competency for personalization
   */
  async analyzeUserCompetency(userProfile) {
    try {
      // Get user's tutorial progress
      const progress = await tutorialService.getUserProgress({
        includeDetails: true,
        timeRange: 'all'
      });

      const analysis = {
        level: 'beginner',
        strengths: [],
        weaknesses: [],
        completedCategories: [],
        timeSpent: progress.summary?.totalTimeSpent || 0,
        averageScore: progress.summary?.averageScore || 0,
        consistency: 'low'
      };

      if (progress.summary) {
        // Determine level based on completed content and scores
        const { totalCompleted, averageScore } = progress.summary;
        
        if (totalCompleted >= 15 && averageScore >= 85) {
          analysis.level = 'advanced';
        } else if (totalCompleted >= 5 && averageScore >= 70) {
          analysis.level = 'intermediate';
        }

        // Analyze category completion
        const categories = {};
        progress.details.forEach(item => {
          if (item.contentDetails?.category) {
            const category = item.contentDetails.category;
            if (!categories[category]) categories[category] = { completed: 0, total: 0 };
            categories[category].total++;
            if (item.completed) categories[category].completed++;
          }
        });

        // Identify strengths and weaknesses
        Object.entries(categories).forEach(([category, stats]) => {
          const completion = stats.completed / stats.total;
          if (completion >= 0.8) {
            analysis.strengths.push(category);
          } else if (completion < 0.5) {
            analysis.weaknesses.push(category);
          }
        });

        // Calculate consistency
        if (progress.details.length >= 3) {
          const recent = progress.details.slice(0, 3);
          const variance = this.calculateScoreVariance(recent.map(p => p.completionScore || 0));
          analysis.consistency = variance < 10 ? 'high' : variance < 20 ? 'medium' : 'low';
        }
      }

      return analysis;
    } catch (error) {
      console.error('❌ Error analyzing user competency:', error);
      return {
        level: 'beginner',
        strengths: [],
        weaknesses: [],
        completedCategories: [],
        timeSpent: 0,
        averageScore: 0,
        consistency: 'low'
      };
    }
  }

  /**
   * Personalize content based on user profile and competency
   */
  async personalizeContent(content, userProfile, competencyAnalysis) {
    const personalized = { ...content };

    // Adjust content based on user level
    if (competencyAnalysis.level === 'beginner') {
      // Add more explanatory content and tips
      personalized.additionalTips = this.generateBeginnerTips(content);
      personalized.showHints = true;
      personalized.complexity = 'simplified';
    } else if (competencyAnalysis.level === 'advanced') {
      // Add advanced techniques and challenges
      personalized.advancedTechniques = this.generateAdvancedContent(content);
      personalized.showHints = false;
      personalized.complexity = 'detailed';
    }

    // Customize based on strengths and weaknesses
    if (competencyAnalysis.weaknesses.includes(content.category)) {
      personalized.extraGuidance = true;
      personalized.prerequisiteCheck = true;
    }

    return personalized;
  }

  /**
   * Generate user-specific tips
   */
  async generateUserSpecificTips(content, userProfile) {
    const tips = [];

    // Add tips based on content type and user history
    if (content.category === TUTORIAL_CATEGORIES.EXERCISE_TECHNIQUES) {
      tips.push({
        type: 'technique',
        message: 'Focus on form over speed - quality repetitions build muscle memory',
        priority: 'high'
      });
    }

    if (content.category === TUTORIAL_CATEGORIES.RECORDING_PRACTICES) {
      tips.push({
        type: 'setup',
        message: 'Test your setup with a short recording before your main session',
        priority: 'medium'
      });
    }

    // Add personalized tips based on user's common mistakes
    // This could be enhanced with ML-based personalization
    
    return tips;
  }

  /**
   * Utility methods
   */

  getOptimalVideoQuality(networkCondition) {
    const qualityMap = {
      'excellent': 'high',
      'good': 'medium',
      'fair': 'low',
      'poor': 'low'
    };
    return qualityMap[networkCondition] || 'medium';
  }

  getOptimalImageQuality(deviceType) {
    const qualityMap = {
      'mobile': 'medium',
      'tablet': 'high',
      'desktop': 'high'
    };
    return qualityMap[deviceType] || 'medium';
  }

  adjustComplexityForUser(baseComplexity, userLevel) {
    if (userLevel === 'beginner' && baseComplexity === 'high') {
      return 'medium';
    }
    if (userLevel === 'advanced' && baseComplexity === 'low') {
      return 'medium';
    }
    return baseComplexity;
  }

  adjustContentForLevel(content, userLevel) {
    const adjusted = { ...content };

    if (userLevel === 'beginner') {
      // Simplify language and add more guidance
      adjusted.language = 'simple';
      adjusted.guidanceLevel = 'high';
    } else if (userLevel === 'advanced') {
      // Use technical language and assume knowledge
      adjusted.language = 'technical';
      adjusted.guidanceLevel = 'low';
    }

    return adjusted;
  }

  formatProgressionName(progression) {
    return progression
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  calculateScoreVariance(scores) {
    if (scores.length === 0) return 0;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    return Math.sqrt(variance);
  }

  generateBeginnerTips(content) {
    return [
      'Take your time to understand each step',
      'Practice each movement slowly first',
      'Don\'t worry about perfect form initially',
      'Ask for help if you\'re unsure about anything'
    ];
  }

  generateAdvancedContent(content) {
    return {
      variations: 'Multiple exercise variations and modifications',
      biomechanics: 'Detailed biomechanical analysis',
      programming: 'Integration into training programs',
      troubleshooting: 'Advanced troubleshooting techniques'
    };
  }

  /**
   * Learning path methods
   */

  async defineLearningObjectives(goal, competency, focusAreas) {
    const objectives = [];
    
    // Base objectives for different goals
    const goalObjectives = {
      'improve-form': [
        { id: 'basic-technique', title: 'Master basic exercise technique' },
        { id: 'error-recognition', title: 'Learn to identify form errors' },
        { id: 'self-correction', title: 'Develop self-correction skills' }
      ],
      'learn-recording': [
        { id: 'setup-basics', title: 'Understand recording setup' },
        { id: 'lighting-angles', title: 'Master lighting and camera angles' },
        { id: 'quality-analysis', title: 'Evaluate recording quality' }
      ]
    };

    const baseObjectives = goalObjectives[goal] || [];
    objectives.push(...baseObjectives);

    // Add focus area specific objectives
    focusAreas.forEach(area => {
      objectives.push({
        id: `focus-${area}`,
        title: `Specialized training in ${area}`
      });
    });

    return objectives;
  }

  async createLearningPhases(objectives, competency) {
    const phases = [];
    
    // Group objectives into phases
    const phaseSize = Math.max(2, Math.ceil(objectives.length / 3));
    
    for (let i = 0; i < objectives.length; i += phaseSize) {
      const phaseObjectives = objectives.slice(i, i + phaseSize);
      
      phases.push({
        id: `phase-${Math.floor(i / phaseSize) + 1}`,
        title: `Phase ${Math.floor(i / phaseSize) + 1}`,
        objectives: phaseObjectives,
        estimatedDuration: phaseObjectives.length * 7, // 7 days per objective
        prerequisites: i > 0 ? [`phase-${Math.floor(i / phaseSize)}`] : [],
        content: await this.getPhaseContent(phaseObjectives, competency)
      });
    }

    return phases;
  }

  async getPhaseContent(objectives, competency) {
    const content = [];
    
    for (const objective of objectives) {
      // Find relevant tutorials for each objective
      const tutorialCategories = await tutorialService.getTutorialCategories();
      
      for (const category of tutorialCategories) {
        const categoryContent = await tutorialService.getCategoryContent(category.id, {
          onlyIncomplete: true
        });
        
        // Filter content relevant to objective
        const relevantContent = categoryContent.filter(item => 
          this.isContentRelevantToObjective(item, objective)
        );
        
        content.push(...relevantContent.slice(0, 3)); // Limit per category
      }
    }

    return content;
  }

  isContentRelevantToObjective(content, objective) {
    // Simple relevance matching - could be enhanced with ML
    const keywords = objective.title.toLowerCase().split(' ');
    const contentText = `${content.title} ${content.description}`.toLowerCase();
    
    return keywords.some(keyword => contentText.includes(keyword));
  }

  defineMilestones(objectives) {
    return objectives.map((objective, index) => ({
      id: `milestone-${index + 1}`,
      title: `Complete ${objective.title}`,
      description: `Successfully complete all content related to ${objective.title}`,
      objectiveId: objective.id,
      reward: index === objectives.length - 1 ? 'completion-badge' : 'progress-badge'
    }));
  }

  generatePathTitle(goal, level) {
    const titles = {
      'improve-form': `${level.charAt(0).toUpperCase() + level.slice(1)} Form Improvement Path`,
      'learn-recording': `${level.charAt(0).toUpperCase() + level.slice(1)} Recording Mastery Path`
    };
    
    return titles[goal] || `${level.charAt(0).toUpperCase() + level.slice(1)} Learning Path`;
  }

  generatePathDescription(goal, objectives) {
    const objectiveTitles = objectives.map(obj => obj.title).join(', ');
    return `A structured learning path to ${goal.replace('-', ' ')}. Covers: ${objectiveTitles}`;
  }

  calculatePathDuration(objectives, intensity) {
    const baseHours = objectives.length * 4; // 4 hours per objective
    
    const intensityMultipliers = {
      'light': 1.5,
      'moderate': 1.0,
      'intensive': 0.7
    };
    
    return Math.ceil(baseHours * (intensityMultipliers[intensity] || 1.0));
  }
}

// Create singleton instance
const tutorialContentManager = new TutorialContentManager();

// Export both the class and instance
export default tutorialContentManager;
export { TutorialContentManager };