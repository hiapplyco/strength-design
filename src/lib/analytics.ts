// Plausible Analytics Helper Functions for strength.design

declare global {
  interface Window {
    plausible: (eventName: string, options?: { props?: Record<string, string | number> }) => void;
  }
}

/**
 * Track a custom event with optional properties
 */
export const trackEvent = (eventName: string, props?: Record<string, string | number>) => {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(eventName, { props });
  }
};

/**
 * Track page views manually (useful for SPAs)
 */
export const trackPageView = (path?: string) => {
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible('pageview', path ? { props: { path } } : undefined);
  }
};

/**
 * Track form submissions
 */
export const trackFormSubmit = (formName: string, success: boolean, metadata?: Record<string, string | number>) => {
  trackEvent('Form Submit', {
    form: formName,
    success: success ? 'true' : 'false',
    ...metadata
  });
};

/**
 * Track user actions
 */
export const trackAction = (action: string, category: string, value?: string | number) => {
  const props: Record<string, string | number> = {
    action,
    category
  };
  if (value !== undefined) {
    props.value = value;
  }
  trackEvent('User Action', props);
};

/**
 * Track errors
 */
export const trackError = (errorType: string, errorMessage: string, context?: string) => {
  trackEvent('Error', {
    type: errorType,
    message: errorMessage.substring(0, 100), // Limit message length
    ...(context && { context })
  });
};

// Strength.design specific tracking functions

/**
 * Track workout generation
 */
export const trackWorkoutGeneration = (params: {
  method: 'ai' | 'template' | 'manual';
  exerciseCount?: number;
  duration?: number;
  difficulty?: string;
}) => {
  trackEvent('Workout Generated', {
    method: params.method,
    ...(params.exerciseCount && { exercise_count: params.exerciseCount }),
    ...(params.duration && { duration: params.duration }),
    ...(params.difficulty && { difficulty: params.difficulty })
  });
};

/**
 * Track exercise interactions
 */
export const trackExerciseAction = (action: 'view' | 'add' | 'remove' | 'complete', exerciseName: string) => {
  trackEvent('Exercise Action', {
    action,
    exercise: exerciseName
  });
};

/**
 * Track AI chat interactions
 */
export const trackAIInteraction = (type: 'question' | 'workout_request' | 'feedback', responseTime?: number) => {
  trackEvent('AI Interaction', {
    type,
    ...(responseTime && { response_time_ms: responseTime })
  });
};

/**
 * Track user authentication events
 */
export const trackAuth = (event: 'signup' | 'login' | 'logout', method?: string) => {
  trackEvent('Authentication', {
    event,
    ...(method && { method })
  });
};

/**
 * Track subscription events
 */
export const trackSubscription = (event: 'trial_start' | 'upgrade' | 'downgrade' | 'cancel', plan?: string) => {
  trackEvent('Subscription', {
    event,
    ...(plan && { plan })
  });
};

/**
 * Track nutrition tracking
 */
export const trackNutrition = (action: 'log_meal' | 'set_goals' | 'view_progress', calories?: number) => {
  trackEvent('Nutrition Tracking', {
    action,
    ...(calories && { calories })
  });
};

/**
 * Track social features
 */
export const trackSocial = (action: 'share' | 'follow' | 'like' | 'comment', contentType: string) => {
  trackEvent('Social Action', {
    action,
    content_type: contentType
  });
};

/**
 * Track video analysis
 */
export const trackVideoAnalysis = (exerciseType: string, duration: number, success: boolean) => {
  trackEvent('Video Analysis', {
    exercise_type: exerciseType,
    duration,
    success: success ? 'true' : 'false'
  });
};

/**
 * Track search queries
 */
export const trackSearch = (query: string, resultCount: number, searchType: 'exercise' | 'program' | 'user') => {
  trackEvent('Search', {
    query: query.substring(0, 50), // Limit query length
    result_count: resultCount,
    type: searchType
  });
};

/**
 * Track feature usage
 */
export const trackFeatureUsage = (feature: string, action?: string) => {
  trackEvent('Feature Usage', {
    feature,
    ...(action && { action })
  });
};