# Strength.Design - AI Claude Development Guide

## 🚨 PRODUCTION DEVELOPMENT STANDARDS

### Core Principles
1. **NO FALLBACKS** - Build for production reliability from the start
2. **Proper Error Handling** - Every error must be caught, logged, and handled gracefully
3. **Comprehensive Logging** - Log all critical operations with appropriate levels (error, warn, info, debug)
4. **Production Testing** - All code must be tested for production scenarios
5. **Monitoring & Analytics** - Implement tracking for all user actions and system events
6. **Performance First** - Optimize for real-world usage patterns

### Development Requirements
- **Error Boundaries**: Wrap all components with error boundaries
- **Retry Logic**: Implement exponential backoff for network requests
- **Loading States**: Show proper loading indicators, never leave users guessing
- **Error Messages**: User-friendly error messages with actionable next steps
- **Telemetry**: Track performance metrics and user behavior
- **Crash Reporting**: Integrate Sentry or similar for production monitoring

### Production Code Patterns

#### Error Handling Pattern
```typescript
try {
  // Operation
  logger.info('Starting operation', { context });
  const result = await operation();
  logger.info('Operation successful', { result });
  return result;
} catch (error) {
  logger.error('Operation failed', { error, context });
  // Send to crash reporting
  Sentry.captureException(error);
  // User-friendly error
  throw new UserError('Unable to complete action. Please try again.');
}
```

#### NO FALLBACK - Use Proper Error States
```typescript
// ❌ NEVER DO THIS - Silent fallback
const data = await fetchData().catch(() => localData);

// ✅ DO THIS - Explicit error handling
try {
  const data = await fetchData();
  return { status: 'success', data };
} catch (error) {
  logger.error('Data fetch failed', error);
  return { status: 'error', error: error.message };
}
```

#### Logging Standards
```typescript
// Use structured logging with context
logger.info('User action', {
  action: 'exercise_search',
  userId: user.id,
  query: searchTerm,
  timestamp: Date.now(),
  sessionId: session.id
});

// Log levels:
// ERROR: System errors, failures requiring attention
// WARN: Degraded performance, retry scenarios
// INFO: User actions, successful operations
// DEBUG: Development only, detailed traces
```

## 🎯 Current Status & Next Steps

### ✅ Mobile App v1.0 COMPLETE! (Production Ready)
- **Firebase Migration**: ✅ Complete - mobile app fully migrated from Supabase to Firebase
- **Authentication**: ✅ Firebase Auth with biometric support (FaceID/TouchID) and phone auth
- **Navigation**: ✅ Complete auth flow and main app navigation structure
- **Glassmorphism Design**: ✅ Modern liquid glass UI with dynamic gradients and blur effects
- **AI Workout Generation**: ✅ Real-time chat with Gemini 2.5 Flash AI integration
- **Exercise Library**: ✅ Intelligent search with 873+ exercises and natural language understanding
- **Workout Management**: ✅ Full CRUD operations with favorites and detailed views
- **Active Workout Tracking**: ✅ Complete with timers, set/rep tracking, progress logging, and session saving
- **Offline Support**: ✅ SQLite database with automatic background sync and conflict resolution
- **Push Notifications**: ✅ Complete notification system with workout reminders and motivational messages
- **Health Integration**: ✅ Apple Health (iOS) and Google Fit (Android) full integration
- **Haptic Feedback**: ✅ Rich tactile feedback throughout the app with customization settings
- **Gesture Navigation**: ✅ Swipe gestures for intuitive exercise navigation
- **Pull-to-Refresh**: ✅ Implemented across all major screens with haptic feedback
- **Performance Optimization**: ✅ Firebase indexes optimized and search performance enhanced
- **Error Handling**: ✅ Comprehensive error boundaries and production-ready error states

### 🚀 Future Enhancements
1. **Social Features** - Share workouts with friends, follow users, community challenges
2. **Video Analysis** - AI-powered form checking with device camera
3. **Gamification** - Achievements, streaks, XP system, and leaderboards
4. **Premium Features** - Advanced AI coaching personalities, custom programs

### 📁 Mobile App Structure (Consolidated)
**Location**: `/mobile/` - Single unified mobile directory

**Key Files:**
- `/mobile/screens/UnifiedSearchScreen.js` - Unified exercise + nutrition search with NLU
- `/mobile/screens/ContextAwareGeneratorScreen.js` - AI workout generation with Gemini 2.5
- `/mobile/services/searchService.js` - Intelligent search with 873 exercises
- `/mobile/services/NutritionService.js` - USDA nutrition database integration
- `/mobile/functions/index.js` - Firebase Functions with real Gemini AI

**Features Implemented:**
- ✅ Real Gemini 2.5 Flash integration (not mocks)
- ✅ Unified Search with natural language understanding
- ✅ Firebase emulator support for local development
- ✅ Health service integration (Apple Health/Google Fit)
- ✅ Comprehensive exercise database (873 exercises)
- ✅ Nutrition search with USDA fallback

**Firebase Functions:**
- `functions/src/notifications/` - Notification scheduling functions ✅
- `functions/src/exercises/searchExercises.ts` - Exercise search ✅
- `functions/src/exercises/getExerciseCategories.ts` - Categories ✅

## Project Overview

Strength.Design is an AI-powered fitness platform that creates personalized workout plans through conversational interfaces. Built on Firebase's complete platform with Gemini AI integration.

**Status**: Both web and mobile platforms complete and production-ready with full Firebase integration
**Tech Stack**: React + TypeScript + React Native + Firebase (Auth, Firestore, Storage, Functions, AI Logic)

## Quick Start

```bash
# Web Development
cd strength-design
npm install
npm run dev          # Start web app at localhost:3000

# Mobile Development
cd mobile
npm install
npm run web          # Start mobile web at localhost:8081

# Firebase Emulators (for mobile)
cd mobile
firebase emulators:start --project demo-strength-design

# Deployment
firebase deploy      # Deploy all services
firebase deploy --only functions  # Deploy functions only
```

## Firebase Stack

### Overview
The application is fully integrated with Firebase services for a complete serverless architecture.

### 1. Firebase Authentication
```typescript
// Supported providers
- Email/Password authentication
- Google OAuth
- Phone authentication (with reCAPTCHA)
- Anonymous authentication

// Implementation: src/hooks/firebase/useAuth.ts
const { 
  signIn, 
  signUp, 
  signInWithGoogle, 
  signInWithPhone,
  verifyPhoneCode,
  setupPhoneRecaptcha 
} = useFirebaseAuth();
```

**Phone Auth Setup**:
1. Enable Phone provider in Firebase Console
2. Add test numbers for development: `+1 555-555-5555` (code: `123456`)
3. Component includes rate limiting (3 attempts/15 min)
4. Invisible reCAPTCHA integration

### 2. Firestore Database
```typescript
// Collections
users/          # User profiles
workouts/       # Workout templates
chatSessions/   # AI chat sessions
messages/       # Chat messages
workoutSessions/  # Scheduled workouts
nutritionLogs/  # Nutrition tracking

// Security: firestore.rules
- Authentication required for all operations
- Users can only access their own data
- Rate limiting on chat operations
```

### 3. Firebase Storage
```typescript
// Storage buckets
workouts/       # Workout images and videos
avatars/        # User profile pictures
exercises/      # Exercise demonstration media

// Security: storage.rules
- Authenticated uploads only
- File size limits: 10MB images, 100MB videos
- Content type validation
```

### 4. Cloud Functions
```typescript
// Deployed functions (Node.js 20)
chatWithGemini      # AI chat endpoint
enhancedChat        # Advanced chat with context
generateWorkout     # Workout generation
generateWorkoutTitle    # Title generation
generateWorkoutSummary  # Summary generation
createCheckout      # Stripe checkout
customerPortal      # Stripe portal
stripeWebhook       # Payment webhooks

// Local development
cd functions && npm run serve
```

### 5. Firebase AI Logic (Gemini 2.5 Integration)

**CRITICAL**: Always use `gemini-2.5-flash` model exclusively. All other models are deprecated.

```typescript
// Server-side (Firebase Functions) - REQUIRED for production
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Correct usage with system instruction
const result = await model.generateContent({
  contents: [{ role: "user", parts: [{ text: prompt }] }],
  generationConfig: {
    maxOutputTokens: 8192,
    temperature: 0.7,
  },
  systemInstruction: "You are a fitness expert...", // Simple string format
});

// Handle httpsCallable wrapped data
const data = req.body.data || req.body;
const { message, history } = data;
```

**Key Features of Gemini 2.5 Flash**:
- First Flash model with thinking capabilities
- Reasoning model with self fact-checking
- Dynamic and controllable computing
- Most cost-efficient ($0.10/1M input, $0.40/1M output)
- Best price/performance ratio
- 1M+ token context window

**Best Practices**:
1. **Model Selection**: ONLY use `gemini-2.5-flash` - all other models deprecated
2. **System Instructions**: Use simple string format, not object
3. **Data Handling**: Support both direct calls and httpsCallable wrapped data
4. **Error Handling**: Always validate API key availability
5. **Security**: Never expose API keys in client code - use Firebase Functions

**Migration Alert**:
- ❌ Gemini 1.0/1.5: Deprecated/Retired
- ❌ Gemini 2.0: Deprecated
- ✅ Gemini 2.5-flash: Current production model
- ✅ Gemini 2.5-flash-lite: Available for ultra-low-cost needs

**Important**: Gemini API keys are stored server-side only. Never expose them in client code.

### 6. Environment Configuration
```env
# Web (.env.local)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Mobile (Expo .env)
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id

# Functions environment (set via Firebase CLI)
firebase functions:config:set gemini.api_key="your-key"
firebase functions:config:set stripe.secret_key="your-key"
firebase functions:config:set stripe.webhook_secret="your-secret"
```

### 7. Firebase Security Best Practices
1. **App Check**: Enable for production to prevent abuse
2. **Rules**: Strict Firestore and Storage rules enforced
3. **Rate Limiting**: Implemented in functions and client
4. **Authentication**: Required for all data operations
5. **CORS**: Configured for allowed origins only
6. **Mobile**: Use Expo config vars (EXPO_PUBLIC_FIREBASE_*) for client-side keys

### 8. Deployment Checklist
- [ ] Ensure Blaze plan is active
- [ ] All required APIs enabled
- [ ] Environment variables configured
- [ ] Security rules tested
- [ ] Functions deployed successfully
- [ ] App Check enabled (production)

## Design System

### Core Principles
1. **Consistency**: Unified patterns across all components
2. **Accessibility**: WCAG 2.1 AA compliance
3. **Performance**: Optimized loading and rendering
4. **Mobile-first**: Touch-optimized, responsive design
5. **Delightful**: Purposeful animations and interactions

### Design Tokens (`src/lib/design-tokens.ts`)

```typescript
// Colors
primary: "hsl(25 95% 53%)"     // Warm orange
success: "hsl(142 71% 45%)"    // Green
gradients: {
  border: "from-[#4CAF50] via-[#9C27B0] to-[#FF1493]",
  sunset: "from-orange-400 via-red-500 to-pink-500",
}

// Typography (Tailwind classes)
h1: "text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
h2: "text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight"
body: "text-sm sm:text-base"

// Spacing
component: { xs: "p-2", sm: "p-3", md: "p-4", lg: "p-6", xl: "p-8" }
gap: { xs: "gap-2", sm: "gap-3", md: "gap-4", lg: "gap-6", xl: "gap-8" }
```

### Component Variants

```typescript
// Card variants
cardVariants = {
  default: "gradient-border shadow-sm",    // With animated gradient
  ghost: "bg-card/50 backdrop-blur-sm",   // Subtle UI
  elevated: "shadow-lg border-border/20",  // Important content
  interactive: "hover:scale-[1.02]",       // Clickable cards
}

// Button usage
buttonGuidelines = {
  primary: "variant='default'",      // Save, Submit, Generate
  secondary: "variant='outline'",    // Cancel, Back
  destructive: "variant='destructive'", // Delete, Remove
  navigation: "variant='ghost'",     // Links, breadcrumbs
  icon: "variant='ghost' size='icon'", // Icon-only
}
```

### Key Components

**StandardPageLayout** - Wrap ALL pages
```tsx
<StandardPageLayout title="Page Title" showBack={true}>
  {/* content */}
</StandardPageLayout>
```

**SectionContainer** - Group content
```tsx
<SectionContainer title="Section" variant="default" spacing="md">
  {/* content */}
</SectionContainer>
```

**EmptyState** - No data states
```tsx
<EmptyState 
  icon={<FileText />} 
  title="No workouts yet"
  action={<Button>Create</Button>}
/>
```

**Toast patterns**
```typescript
toast.success("Saved!");
toast.error("Failed!");
toast.info("Tip: ...");
toast.loading("Loading...");
```


## Architecture & Patterns

### Directory Structure
```
src/
├── components/
│   ├── ui/          # Base UI components (shadcn)
│   ├── layout/      # Layout components
│   ├── workout/     # Workout-specific
│   └── shared/      # Shared components
├── pages/           # Route pages
├── hooks/           # Custom React hooks
├── lib/             # Utilities and helpers
├── services/        # API services
└── types/           # TypeScript types
```

### Component Pattern
```tsx
interface ComponentProps {
  variant?: "default" | "ghost";
  className?: string;
  children: React.ReactNode;
}

export function Component({ 
  variant = "default", 
  className,
  children 
}: ComponentProps) {
  return (
    <div className={cn(variants[variant], className)}>
      {children}
    </div>
  );
}
```

### Hook Pattern
```typescript
export function useExample() {
  const [state, setState] = useState();
  
  const computed = useMemo(() => compute(state), [state]);
  const handler = useCallback((x) => handle(x), [dep]);
  
  useEffect(() => {
    // Effect
    return () => cleanup();
  }, []);
  
  return { state, computed, handler };
}
```

## Current Status

### ✅ Completed Features
- **Web Platform**: Complete with all features production-ready
- **Mobile Platform**: v1.0 complete with glassmorphism design
- **Authentication**: Email, social (Google/Apple), phone, biometric
- **AI Workout Generation**: Real-time chat with Gemini 2.5 Flash
- **Exercise Library**: 873+ exercises with intelligent search and NLU
- **Workout Management**: Full CRUD with offline support and sync
- **Active Workout Tracking**: Complete with timers and progress logging
- **Health Integration**: Apple Health and Google Fit full sync
- **Push Notifications**: Smart reminders and motivational messages
- **Design System**: Unified glassmorphism design across platforms
- **Performance Optimization**: Firebase indexes and search optimization
- **Error Handling**: Production-ready error boundaries and states

### 🚧 In Development
- **Social Features**: Share workouts and follow users
- **AI Personalities**: Custom trainer voices and coaching styles
- **Advanced Analytics**: Detailed progress tracking and insights

### 📋 Planned Features
- **Gamification**: Achievements, XP, levels, leaderboards
- **Video Analysis**: AI-powered form checking with device camera
- **Advanced AI Personalities**: Multiple coaching styles and voices
- **Community Features**: Public workout sharing and challenges
- **Wearable Integration**: Apple Watch and Wear OS support

