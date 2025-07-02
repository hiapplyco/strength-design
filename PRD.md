# Strength.Design Product Requirements Document (PRD)

## Product Overview

Strength.Design is an AI-powered fitness platform that creates personalized workout plans through conversational interfaces. This PRD consolidates all product requirements for both web and mobile platforms, focusing on the path forward.

## Current State

### ✅ Completed (Web Platform)
- **Core Infrastructure**
  - Supabase backend with authentication, database, and real-time features
  - Vite + React + TypeScript web application
  - Comprehensive design system with Tailwind CSS and shadcn/ui
  - Mobile-responsive web interface

- **Features Implemented**
  - User authentication (email, social, phone)
  - AI-powered workout generation via chat interface
  - Exercise library with categorization
  - Workout templates and saving
  - Program search integration (Perplexity AI)
  - Real-time updates and notifications
  - Progress tracking foundation

- **Design System**
  - Unified color tokens and typography scale
  - Component variants (cards, buttons, inputs)
  - Responsive layouts with StandardPageLayout
  - Touch-optimized interfaces
  - Gradient borders and consistent styling

### 🚧 In Progress
- **Mobile App Development**: Currently no functional mobile app exists despite initial directory setup

## Mobile App Requirements

### Technology Stack Decision
```typescript
{
  "framework": "React Native with Expo SDK 50+",
  "language": "TypeScript",
  "navigation": "React Navigation v6",
  "state": "TanStack Query + Zustand",
  "ui": "NativeWind (Tailwind for RN) + Custom Components",
  "backend": "Existing Supabase (shared with web)",
  "auth": "Supabase Auth with biometric support",
  "testing": "Jest + React Native Testing Library",
  "ci/cd": "EAS Build + GitHub Actions"
}
```

### Mobile MVP Features (Phase 1 - 4 weeks)

#### 1. Project Setup & Core Infrastructure
- **Week 1**: Initialize Expo project with TypeScript
  - Configure NativeWind for consistent styling with web
  - Set up navigation structure
  - Configure Supabase client
  - Implement shared types/interfaces from web

#### 2. Authentication Flow
- **Week 1-2**: Complete auth implementation
  - Email/password login
  - Social auth (Google, Apple)
  - Phone number verification
  - Biometric authentication (FaceID/TouchID)
  - Session persistence
  - Auto-login on app launch

#### 3. Core Workout Features
- **Week 2-3**: Port essential workout functionality
  - Workout generation chat interface
  - Exercise library browsing
  - Workout template viewing
  - Active workout tracking with timer
  - Exercise completion marking
  - Rest timer with notifications

#### 4. Data Sync & Offline Support
- **Week 3-4**: Implement robust data handling
  - Offline-first architecture with local SQLite
  - Background sync with Supabase
  - Conflict resolution for offline edits
  - Image caching for exercises
  - Queue system for offline actions

### Mobile-Specific Features (Phase 2 - 4 weeks)

#### 1. Native Integrations
- Apple Health / Google Fit integration
- Push notifications for:
  - Workout reminders
  - Rest day suggestions
  - Achievement unlocks
  - Social interactions
- Camera integration for form checks
- Haptic feedback for interactions

#### 2. Enhanced Mobile UX
- Swipe gestures for navigation
- Pull-to-refresh on all screens
- Bottom sheet modals
- Native action sheets
- Platform-specific UI adjustments
- Landscape support for video viewing

#### 3. Performance Features
- Lazy loading for exercise videos
- Image optimization and caching
- Background task handling
- Memory management for long workouts
- Battery optimization mode

### Shared Code Strategy

```
strength-design/
├── packages/
│   ├── shared/
│   │   ├── types/          # TypeScript interfaces
│   │   ├── api/            # Supabase queries and mutations
│   │   ├── utils/          # Common utilities
│   │   ├── constants/      # Shared constants
│   │   └── validators/     # Form validation schemas
│   ├── web/                # Current web app
│   └── mobile/             # New React Native app
```

### Development Approach

#### Immediate Actions (Week 1)
1. **Clean up existing structure**
   - Remove empty `/apps/mobile` directory
   - Move `/apps/mobile-fresh` to `/packages/mobile`
   - Initialize proper Expo project

2. **Set up monorepo**
   - Configure workspace with npm/yarn workspaces
   - Share TypeScript config
   - Set up shared package

3. **Port critical types**
   - User types
   - Workout/Exercise types
   - API response types
   - Supabase generated types

#### Code Sharing Examples
```typescript
// packages/shared/api/workouts.ts
export const workoutQueries = {
  getWorkouts: (userId: string) => ({
    queryKey: ['workouts', userId],
    queryFn: () => supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
  }),
  
  createWorkout: async (workout: WorkoutInput) => {
    const { data, error } = await supabase
      .from('workouts')
      .insert(workout)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Used in both web and mobile:
// packages/web/src/hooks/useWorkouts.ts
// packages/mobile/src/hooks/useWorkouts.ts
import { useQuery } from '@tanstack/react-query';
import { workoutQueries } from '@strength-design/shared/api';
```

### UI/UX Consistency

#### Design Token Sharing
```typescript
// packages/shared/design/tokens.ts
export const colors = {
  primary: {
    DEFAULT: "#FF6B35",
    light: "#FF8F5A",
    dark: "#E55A2B",
  },
  // ... rest of color system
};

// Web: Used directly in Tailwind config
// Mobile: Used in NativeWind config
```

#### Component Parity
- Maintain identical information architecture
- Use same iconography (Lucide React Native)
- Consistent navigation patterns
- Matching animation timings
- Identical form validation

### Success Metrics

#### Phase 1 Success Criteria
- [ ] Users can log in and access their workouts
- [ ] Workout generation works identically to web
- [ ] Offline mode allows workout completion without internet
- [ ] App runs smoothly on iOS 14+ and Android 10+
- [ ] Crash rate < 1%
- [ ] App size < 50MB

#### Phase 2 Success Criteria
- [ ] 60% of web users download mobile app
- [ ] Mobile retention rate > 40% after 30 days
- [ ] Average session time > 15 minutes
- [ ] App store rating > 4.5 stars
- [ ] Health app integration adoption > 30%

### Timeline & Milestones

```mermaid
gantt
    title Mobile Development Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    Project Setup           :2024-01-01, 7d
    Authentication         :7d
    Core Features          :14d
    Offline Support        :7d
    section Phase 2
    Native Integrations    :14d
    Enhanced UX           :7d
    Performance           :7d
    section Launch
    Beta Testing          :14d
    App Store Prep        :7d
    Launch               :milestone
```

### Risk Mitigation

| Risk | Impact | Mitigation Strategy |
|------|--------|-------------------|
| Code duplication | High | Monorepo with shared packages |
| Feature parity drift | Medium | Automated testing for both platforms |
| Performance issues | High | Regular profiling and optimization |
| Offline sync conflicts | Medium | Clear conflict resolution rules |
| App store rejection | High | Early TestFlight/Play Console testing |

### Next Steps

1. **Immediate (This Week)**
   - Set up monorepo structure
   - Initialize Expo project with TypeScript
   - Configure shared packages
   - Port authentication flow

2. **Short-term (Next 2 Weeks)**
   - Implement core workout features
   - Set up CI/CD pipeline
   - Begin TestFlight beta

3. **Medium-term (Next Month)**
   - Complete Phase 1 features
   - Gather beta feedback
   - Iterate on UX
   - Prepare app store listings

## Web Platform Enhancement Roadmap

### Remaining Web Features

#### 1. AI Personality System
- Custom AI trainers with unique voices
- Personality selection during onboarding
- Dynamic message tone based on context
- Integration with workout generation

#### 2. Advanced Analytics
- Detailed progress charts
- Volume tracking over time
- Strength progression curves
- Body composition tracking
- Export capabilities

#### 3. Social Features
- Public workout sharing
- Community challenges
- Trainer marketplace
- Achievement system

#### 4. Payment Integration
- Stripe integration for premium features
- Subscription management
- Coach marketplace payments
- In-app purchases for mobile

### Technical Debt & Improvements

#### 1. Performance Optimization
- [ ] Implement React.lazy for code splitting
- [ ] Optimize bundle size (target < 200KB)
- [ ] Add service worker for offline support
- [ ] Implement image lazy loading

#### 2. Testing Coverage
- [ ] Increase unit test coverage to 80%
- [ ] Add E2E tests for critical flows
- [ ] Implement visual regression testing
- [ ] Set up performance monitoring

#### 3. Infrastructure
- [ ] Set up staging environment
- [ ] Implement feature flags
- [ ] Add error tracking (Sentry)
- [ ] Configure CDN for assets

## Conclusion

This PRD consolidates all product requirements and provides a clear path forward for Strength.Design. The immediate priority is establishing the mobile app foundation while maintaining feature parity with the web platform. The shared code architecture will ensure consistency and reduce development time.

**Key Decision**: Start fresh with a properly structured React Native/Expo project rather than trying to salvage the empty directory attempts. This will provide a solid foundation for the mobile app development.

---

*Document Version: 1.0*  
*Last Updated: December 2024*  
*Next Review: After Phase 1 Mobile Launch*