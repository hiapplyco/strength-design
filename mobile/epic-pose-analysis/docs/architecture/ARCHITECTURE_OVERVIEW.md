# 🏗️ Strength.Design Architecture Overview

> **Version**: 2.0.0  
> **Last Updated**: January 15, 2025  
> **Status**: Production Architecture

## 🎯 System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                         Clients                             │
├──────────────────┬──────────────────┬──────────────────────┤
│   Web App (PWA)  │  Mobile (iOS)    │  Mobile (Android)    │
│   React + TS     │  React Native    │  React Native        │
└──────────┬───────┴──────────┬───────┴──────────┬───────────┘
           │                  │                   │
           └──────────────────┼───────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Firebase SDK    │
                    │  (Auth, Firestore) │
                    └─────────┬─────────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
    ┌───────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
    │   Firebase   │  │  Firestore  │  │   Storage   │
    │     Auth     │  │  Database   │  │   (Media)   │
    └──────────────┘  └──────┬──────┘  └─────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Cloud Functions  │
                    │   (Node.js 20)    │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼──────┐    ┌────────▼────────┐   ┌───────▼──────┐
│  Gemini AI   │    │  Perplexity AI  │   │   USDA API   │
│  (Workouts)  │    │   (Programs)    │   │ (Nutrition)  │
└──────────────┘    └─────────────────┘   └──────────────┘
```

## 🔧 Technology Stack

### Frontend Technologies
| Layer | Web | Mobile | Shared |
|-------|-----|--------|--------|
| **Framework** | React 18.3 | React Native 0.79 | - |
| **Language** | TypeScript 5.3 | TypeScript 5.3 | TypeScript |
| **Styling** | Tailwind CSS | NativeWind | Design Tokens |
| **State** | Zustand | Zustand | - |
| **Navigation** | React Router | React Navigation | - |
| **Build** | Vite 6.0 | Expo 53 | - |
| **UI Library** | shadcn/ui | Custom Components | - |

### Backend Technologies
| Service | Technology | Purpose |
|---------|------------|---------|
| **Authentication** | Firebase Auth | User management |
| **Database** | Firestore | NoSQL document store |
| **Functions** | Cloud Functions | Serverless compute |
| **Storage** | Firebase Storage | Media files |
| **Hosting** | Firebase Hosting | Web app delivery |
| **AI** | Gemini 2.5 Flash | Workout generation |
| **Search** | Perplexity AI | Program search |
| **Nutrition** | USDA FoodData | Food database |

## 📊 Data Architecture

### Database Schema (Firestore)
```typescript
// Users Collection
interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  subscription: {
    status: 'free' | 'pro' | 'premium';
    validUntil?: Timestamp;
  };
  preferences: {
    units: 'metric' | 'imperial';
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
  };
  stats: {
    workoutsCompleted: number;
    totalExercises: number;
    streakDays: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Workouts Collection
interface Workout {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: 'strength' | 'cardio' | 'flexibility' | 'mixed';
  duration: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: Exercise[];
  tags: string[];
  isTemplate: boolean;
  aiGenerated: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Exercise Interface
interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps?: number;
  duration?: number; // seconds
  weight?: number;
  restTime: number; // seconds
  notes?: string;
  gifUrl?: string;
  targetMuscles: string[];
  equipment: string;
}

// Chat Sessions Collection
interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  context: {
    workoutPreferences?: any;
    generatedWorkouts?: string[];
  };
  createdAt: Timestamp;
  lastMessageAt: Timestamp;
}

// Nutrition Logs Collection
interface NutritionLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  meals: Meal[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  waterIntake: number; // ml
  createdAt: Timestamp;
}
```

### Data Flow Patterns
1. **Real-time Sync**: Firestore listeners for live updates
2. **Offline Support**: Local caching with background sync
3. **Optimistic Updates**: Update UI before server confirmation
4. **Conflict Resolution**: Last-write-wins with version tracking

## 🔄 API Architecture

### Cloud Functions Endpoints
```typescript
// AI Functions
POST /chatWithGemini          // Standard AI chat
POST /streamingChatEnhanced   // Streaming AI responses
POST /generateWorkout         // Structured workout generation
POST /generateWorkoutSummary  // Workout summarization

// Exercise Functions
GET  /searchExercises         // Exercise database search
GET  /getExerciseCategories   // Exercise categories
POST /saveUserExercises       // Save custom exercises

// Nutrition Functions
GET  /searchFoods            // USDA food search
POST /logNutrition           // Log nutrition data
GET  /getNutritionSummary    // Daily nutrition summary

// Program Search
POST /searchPrograms         // Perplexity AI program search

// Payment Functions
POST /createCheckout         // Stripe checkout session
POST /customerPortal         // Stripe customer portal
POST /stripeWebhook          // Payment webhook handler
```

### API Design Principles
- **RESTful**: Standard HTTP methods and status codes
- **Versioning**: API version in URL path
- **Authentication**: Firebase ID tokens
- **Rate Limiting**: Per-user and per-endpoint limits
- **Error Handling**: Consistent error response format
- **Documentation**: OpenAPI/Swagger specs

## 🔐 Security Architecture

### Authentication Flow
```
User → Firebase Auth → ID Token → Cloud Functions → Firestore
         ↓                ↓            ↓              ↓
     Social OAuth    Verify Token  Authorize    Security Rules
```

### Security Layers
1. **Authentication**: Firebase Auth with MFA support
2. **Authorization**: Role-based access control (RBAC)
3. **API Security**: Rate limiting, CORS, API keys
4. **Data Security**: Encryption at rest and in transit
5. **Input Validation**: Server-side validation and sanitization
6. **Security Rules**: Firestore and Storage security rules

### Security Best Practices
- Never expose sensitive keys in client code
- Validate all inputs on server side
- Use least privilege principle
- Implement audit logging
- Regular security audits
- OWASP compliance

## 🚀 Deployment Architecture

### Environments
| Environment | URL | Purpose | Deploy Trigger |
|-------------|-----|---------|----------------|
| **Development** | localhost | Local development | Manual |
| **Staging** | staging.strength.design | Testing | PR merge |
| **Production** | strength.design | Live users | Release tag |

### CI/CD Pipeline
```yaml
Pipeline:
  1. Code Push → GitHub
  2. GitHub Actions Triggered
  3. Run Tests (Unit, Integration, E2E)
  4. Build Applications
  5. Deploy to Staging
  6. Run Smoke Tests
  7. Manual Approval
  8. Deploy to Production
  9. Monitor Metrics
```

### Infrastructure as Code
- Firebase configuration in `firebase.json`
- Environment variables in GitHub Secrets
- Firestore indexes in `firestore.indexes.json`
- Security rules in `firestore.rules`

## 📱 Mobile Architecture

### React Native Architecture
```
┌─────────────────────────────────────┐
│         JavaScript Thread           │
│     (React Native + Business Logic) │
└────────────┬────────────────────────┘
             │ Bridge
┌────────────▼────────────────────────┐
│         Native Modules              │
├──────────────┬──────────────────────┤
│     iOS      │     Android          │
│   (Swift)    │    (Kotlin)          │
└──────────────┴──────────────────────┘
```

### Platform-Specific Features
| Feature | iOS | Android | Implementation |
|---------|-----|---------|----------------|
| **Biometric Auth** | Face ID/Touch ID | Fingerprint | expo-local-authentication |
| **Push Notifications** | APNs | FCM | expo-notifications |
| **Health Data** | HealthKit | Google Fit | react-native-health |
| **Haptic Feedback** | Taptic Engine | Vibration API | expo-haptics |

## 🌐 Web Architecture

### Progressive Web App (PWA)
```typescript
// Service Worker Strategy
- Cache First: Static assets
- Network First: API calls
- Stale While Revalidate: Dynamic content

// Offline Support
- IndexedDB for data persistence
- Background sync for queued operations
- Offline page for degraded experience
```

### Performance Optimization
1. **Code Splitting**: Route-based chunking
2. **Lazy Loading**: Components and images
3. **Bundle Optimization**: Tree shaking, minification
4. **Caching Strategy**: CDN, browser cache, service worker
5. **Image Optimization**: WebP, responsive images

## 🔄 State Management

### Client State Architecture
```typescript
// Zustand Store Structure
interface AppStore {
  // User State
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Workout State
  workouts: Workout[];
  currentWorkout: Workout | null;
  addWorkout: (workout: Workout) => void;
  
  // UI State
  theme: 'light' | 'dark' | 'system';
  isLoading: boolean;
  error: Error | null;
  
  // Actions
  fetchWorkouts: () => Promise<void>;
  generateWorkout: (preferences: any) => Promise<Workout>;
}
```

### Data Synchronization
- **Optimistic Updates**: Update UI immediately
- **Background Sync**: Queue operations when offline
- **Conflict Resolution**: Server authoritative
- **Cache Invalidation**: TTL and event-based

## 🎯 Scalability Considerations

### Current Scale
- **Users**: 1,000+ active users
- **Requests**: 10,000+ API calls/day
- **Storage**: 100GB+ media files
- **Database**: 1M+ documents

### Scaling Strategy
1. **Horizontal Scaling**: Cloud Functions auto-scaling
2. **Database Sharding**: Collection partitioning by user
3. **CDN Distribution**: Global edge caching
4. **Query Optimization**: Composite indexes
5. **Cost Optimization**: Efficient queries, caching

### Performance Targets
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **API Response** | < 200ms | 150ms | ✅ |
| **Page Load** | < 2s | 1.8s | ✅ |
| **App Launch** | < 3s | 2.5s | ✅ |
| **Availability** | 99.9% | 99.95% | ✅ |

## 🔧 Development Workflow

### Local Development Setup
```bash
# Web Development
cd strength-design
npm install
npm run dev

# Mobile Development
cd mobile
npm install
npx expo start

# Firebase Emulators
firebase emulators:start
```

### Development Tools
- **IDE**: VS Code with extensions
- **API Testing**: Postman/Thunder Client
- **Mobile Testing**: Expo Go app
- **Debugging**: React DevTools, Flipper
- **Performance**: Lighthouse, React Profiler

## 📈 Monitoring & Observability

### Monitoring Stack
1. **Application Monitoring**: Sentry
2. **Performance Monitoring**: Firebase Performance
3. **Analytics**: Google Analytics 4
4. **Logging**: Cloud Logging
5. **Uptime**: UptimeRobot

### Key Metrics
- User engagement (DAU, MAU, retention)
- Performance (response times, error rates)
- Business metrics (conversions, feature adoption)
- Infrastructure (costs, usage, limits)

## 🚦 Architecture Decision Records (ADRs)

### ADR-001: Firebase over Supabase
**Decision**: Use Firebase for backend services
**Rationale**: Better mobile SDKs, real-time features, integrated services
**Consequences**: Vendor lock-in, but faster development

### ADR-002: Gemini AI over GPT
**Decision**: Use Gemini 2.5 Flash for AI features
**Rationale**: Better fitness knowledge, cost-effective, streaming support
**Consequences**: Limited to Google's AI capabilities

### ADR-003: Expo Managed Workflow
**Decision**: Use Expo for React Native development
**Rationale**: Faster development, OTA updates, better DX
**Consequences**: Limited native module access

### ADR-004: Monorepo Structure
**Decision**: Keep web and mobile in same repository
**Rationale**: Shared code, consistent deployments
**Consequences**: Larger repository, complex CI/CD

---

> **Note**: This architecture overview is the technical foundation for all development decisions. It should be reviewed quarterly and updated as the system evolves.