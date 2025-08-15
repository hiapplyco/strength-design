# Plausible Analytics Implementation Guide for strength.design

## ✅ Setup Complete

1. **Analytics Script Added** - Added to `index.html`
2. **Helper Functions Created** - `src/lib/analytics.ts`
3. **Basic Tracking Implemented** - Auth events and workout generation

## 📊 Key Events to Track

### 1. User Authentication
```typescript
// Example usage (call from your auth handlers)
trackAuth('signup', 'email'); // When user signs up
trackAuth('login', 'google');  // When user logs in
trackAuth('logout');           // When user logs out
```

### 2. Workout Generation
```typescript
// Example implementation
trackWorkoutGeneration({
  method: 'ai',           // 'ai' | 'template' | 'manual'
  exerciseCount: 8,
  duration: 45,
  difficulty: 'intermediate'
});
```

### 3. Exercise Interactions
```typescript
// In exercise components
trackExerciseAction('view', 'Bench Press');
trackExerciseAction('add', 'Squat');
trackExerciseAction('complete', 'Deadlift');
```

### 4. AI Chat Usage
```typescript
// In chat components
const startTime = Date.now();
// ... AI processes request
trackAIInteraction('workout_request', Date.now() - startTime);
```

### 5. Nutrition Tracking
```typescript
// In nutrition components
trackNutrition('log_meal', 650); // Log meal with calories
trackNutrition('set_goals');
trackNutrition('view_progress');
```

## 🎯 Implementation Locations

### High Priority Components

1. **WorkoutChatLayout** (`src/components/workout-generator/chat/WorkoutChatLayout.tsx`)
   ```typescript
   import { trackAIInteraction } from '@/lib/analytics';
   
   // When sending message
   trackAIInteraction('question', responseTime);
   ```

2. **ExerciseCard** (Exercise interaction tracking)
   ```typescript
   import { trackExerciseAction } from '@/lib/analytics';
   
   // On exercise click
   trackExerciseAction('view', exerciseName);
   ```

3. **NutritionDiary** (Nutrition tracking)
   ```typescript
   import { trackNutrition } from '@/lib/analytics';
   
   // When logging food
   trackNutrition('log_meal', totalCalories);
   ```

4. **VideoAnalysis** (Form check tracking)
   ```typescript
   import { trackVideoAnalysis } from '@/lib/analytics';
   
   // After analysis
   trackVideoAnalysis('squat', videoDuration, success);
   ```

5. **ProgramFinder** (Search tracking)
   ```typescript
   import { trackSearch } from '@/lib/analytics';
   
   // On search
   trackSearch(query, results.length, 'program');
   ```

## 📈 Custom Goals Setup

In Plausible dashboard, set up these goals:

1. **Conversion Goals**
   - `Signup` - Track new user registrations
   - `Workout Generated` - Track successful workout creation
   - `Subscription` - Track plan upgrades

2. **Engagement Goals**
   - `AI Interaction` - Track AI usage
   - `Exercise Action` - Track workout engagement
   - `Social Action` - Track community features

3. **Feature Adoption**
   - `Video Analysis` - Track form check usage
   - `Nutrition Tracking` - Track nutrition feature usage
   - `Feature Usage` - Track overall feature adoption

## 🔍 Debugging Analytics

### Test Events in Browser Console
```javascript
// Test if Plausible is loaded
window.plausible('Test Event', { props: { test: 'true' } });

// Check if event was sent (Network tab)
// Look for request to: https://plausible.io/api/event
```

### Common Issues

1. **Events not showing up**
   - Check if ad blockers are blocking Plausible
   - Verify domain matches exactly: `strength.design`
   - Events may take a few minutes to appear

2. **Props not showing**
   - Ensure props are strings or numbers only
   - Keep prop names short and lowercase
   - Maximum 30 custom props per event

## 📝 Best Practices

1. **Event Naming**
   - Use Title Case for event names
   - Be consistent (e.g., always "Workout Generated", not "Generated Workout")
   - Keep names under 50 characters

2. **Props**
   - Use snake_case for prop names
   - Limit values to prevent cardinality explosion
   - Don't include PII (email, names, etc.)

3. **Performance**
   - Plausible is lightweight (~1KB)
   - Events are sent asynchronously
   - No significant impact on page load speed

## 🚀 Next Steps

1. **Add tracking to remaining components**:
   - [ ] WorkoutChatLayout
   - [ ] ExerciseSearch
   - [ ] NutritionDiary
   - [ ] VideoUpload
   - [ ] ProgramFinder

2. **Set up custom goals in Plausible dashboard**

3. **Create weekly analytics review process**

4. **A/B test key features using event props**

## 📊 Sample Dashboard Queries

Once data is collected, use these insights:

1. **User Journey**
   - Signup → First Workout → Subscription
   - Track conversion at each step

2. **Feature Adoption**
   - Which features do users try first?
   - What's the retention for each feature?

3. **AI Usage Patterns**
   - Most common AI requests
   - Response time impact on usage

4. **Workout Patterns**
   - Popular exercise combinations
   - Average workout duration
   - Difficulty preferences

Remember: Plausible is privacy-first, so you get insights without compromising user privacy!